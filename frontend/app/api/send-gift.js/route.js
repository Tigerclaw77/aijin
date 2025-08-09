import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { processVerbalIntimacy, processPhysicalIntimacy } from '../../../utils/Intimacy/intimacyStateManagerSplit';
import { getGiftEffectList } from '../../../utils/Chat-Gifts/giftUtils';

export async function POST(req) {
  try {
    const body = await req.json();
    const { companion_id, gift_name, gift_id, quantity = 1 } = body;

    if (!companion_id || (!gift_name && !gift_id)) {
      return NextResponse.json({ error: 'MISSING_FIELDS' }, { status: 400 });
    }

    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { get: (n) => cookieStore.get(n)?.value } }
    );

    // Auth
    const { data: auth, error: authErr } = await supabase.auth.getUser();
    if (authErr || !auth?.user) {
      return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
    }
    const user_id = auth.user.id;

    // Companion
    const { data: companion, error: compErr } = await supabase
      .from('companions')
      .select('companion_id, user_id, sub_tier, is_paused, verbal_intimacy, physical_intimacy')
      .eq('companion_id', companion_id)
      .single();

    if (compErr || !companion) return NextResponse.json({ error: 'COMPANION_NOT_FOUND' }, { status: 404 });
    if (companion.user_id !== user_id) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });

    // Gift
    let giftRow = null;
    if (gift_id) {
      const { data, error } = await supabase
        .from('gift_shop')
        .select('id, name, price, available')
        .eq('id', gift_id)
        .single();
      if (error) return NextResponse.json({ error: 'UNKNOWN_GIFT' }, { status: 400 });
      giftRow = data;
    } else {
      const { data, error } = await supabase
        .from('gift_shop')
        .select('id, name, price, available')
        .ilike('name', gift_name) // case-insensitive exact text
        .maybeSingle();
      if (error || !data) return NextResponse.json({ error: 'UNKNOWN_GIFT' }, { status: 400 });
      giftRow = data;
    }
    if (giftRow.available === false) return NextResponse.json({ error: 'GIFT_UNAVAILABLE' }, { status: 409 });

    // Pricing w/ companion sub_tier (drinks only)
    const normTier = (String(companion.sub_tier || 'free').toLowerCase() === 'premium')
      ? 'girlfriend'
      : String(companion.sub_tier || 'free').toLowerCase();

    const isDrink = ['tea', 'coffee', 'boba', 'energy drink'].includes(giftRow.name.toLowerCase());
    let finalUnitPrice = Math.floor(Number(giftRow.price));
    if (isDrink) {
      if (normTier === 'girlfriend') finalUnitPrice = Math.floor(Number(giftRow.price) * 0.75);
      else if (normTier === 'waifu') finalUnitPrice = Math.floor(Number(giftRow.price) * 0.5);
    }

    const qty = Number(quantity) || 1;
    const totalCost = finalUnitPrice * qty;

    // ATOMIC DEDUCT (uses profiles.tokens via RPC you created)
    const { data: d, error: rpcErr } = await supabase.rpc('deduct_tokens', {
      p_user_id: user_id,
      p_amount: totalCost,
    });
    if (rpcErr) {
      console.error('deduct_tokens RPC error:', rpcErr);
      return NextResponse.json({ error: 'PURCHASE_FAILED' }, { status: 500 });
    }
    const newBalance = d?.[0]?.new_balance;
    if (newBalance == null) {
      return NextResponse.json({ error: 'INSUFFICIENT_TOKENS' }, { status: 402 });
    }

    // Log transactions/history
    await supabase.from('gift_transactions').insert({
      user_id,
      companion_id,
      gift_id: giftRow.id,
      quantity: qty,
      total_spent: totalCost,
      token_price: finalUnitPrice,
      status: 'completed',
      platform: 'web',
      notes: `sub_tier=${normTier};name=${giftRow.name}`,
    });

    await supabase.from('gift_history').insert({
      user_id,
      companion_id,
      gift_id: giftRow.id,
      quantity: qty,
    });

    // Intimacy recalc
    const now = new Date();
    const giftList = getGiftEffectList([{ id: giftRow.id, given_at: now }]);
    const baseState = {
      rank: 3,
      isPaused: companion.is_paused ?? false,
      daysInactive: 0,
      messagesToday: 0,
      interactionScore: 1.0,
      giftList,
    };

    const updatedVerbal = processVerbalIntimacy({
      ...baseState,
      currentIntimacy: companion.verbal_intimacy || 0,
    });
    const updatedPhysical = processPhysicalIntimacy({
      ...baseState,
      currentIntimacy: companion.physical_intimacy || 0,
    });

    await supabase
      .from('companions')
      .update({
        verbal_intimacy: updatedVerbal,
        physical_intimacy: updatedPhysical,
        updated_at: now.toISOString(),
      })
      .eq('companion_id', companion_id);

    return NextResponse.json({
      ok: true,
      appliedTier: normTier,
      finalUnitPrice,
      newBalance, // <- from RPC
      updatedVerbalIntimacy: updatedVerbal,
      updatedPhysicalIntimacy: updatedPhysical,
    });
  } catch (e) {
    console.error('gift purchase error:', e);
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 });
  }
}
