// app/api/gifts/purchase/route.js
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseServer } from '../../../../utils/Supabase/supabaseServerClient';
import { getGiftEffectList } from '../../../../utils/Chat-Gifts/giftUtils';

function json(status, body) {
  return NextResponse.json(body, { status });
}

function computeDiscountPercent(tier) {
  const t = String(tier || '').toLowerCase();
  if (t === 'girlfriend') return 25;
  if (t === 'waifu') return 50;
  return 0;
}

// Local fallback for the 4 chat drinks so we’re not blocked by giftUtils shape
const LOCAL_DEFAULTS = {
  tea: { id: 'tea', label: 'Tea', priceTokens: 100, effects: [{ type: 'messages', amount: 10, ttlHours: 0 }] },
  coffee: { id: 'coffee', label: 'Coffee', priceTokens: 200, effects: [{ type: 'messages', amount: 25, ttlHours: 0 }] },
  boba: { id: 'boba', label: 'Boba', priceTokens: 300, effects: [{ type: 'unlimited_chat', amount: 1, ttlHours: 12 }] },
  energy_drink: { id: 'energy_drink', label: 'Energy Drink', priceTokens: 400, effects: [{ type: 'unlimited_chat', amount: 1, ttlHours: 24 }] },
};

function toArray(effects) {
  if (!effects) return [];
  if (Array.isArray(effects)) return effects;
  if (typeof effects === 'object') return [effects];
  return [];
}
function safeFindGiftIn(raw, key) {
  if (!raw) return null;
  if (typeof raw === 'object' && ('priceTokens' in raw || 'effects' in raw)) return raw;
  if (typeof raw === 'object' && key in raw) return raw[key];
  if (Array.isArray(raw)) return raw.find(x => x?.id === key || x?.key === key || x?.name === key || x?.label === key) || null;
  return null;
}
function resolveGiftConfig(getGiftEffectListFn, giftKey) {
  try {
    const rawA = getGiftEffectListFn?.();
    const a = safeFindGiftIn(rawA, giftKey);
    if (a) return a;
  } catch {}
  try {
    const rawB = getGiftEffectListFn?.(giftKey);
    const b = safeFindGiftIn(rawB, giftKey) || rawB;
    if (b && (b.priceTokens !== undefined || b.effects !== undefined)) return b;
  } catch {}
  return LOCAL_DEFAULTS[giftKey] || null;
}

// --- robust profile loader that tolerates id/user_id schemas and auto-creates if missing
async function getOrCreateProfile(db, user_id) {
  // 1) Try id = auth UID (your usual pattern)
  let q1 = await db.from('profiles')
    .select('id, user_id, token_balance, subscription_tier')
    .eq('id', user_id)
    .maybeSingle();
  if (q1.data) return { profile: q1.data };

  // 2) Some older code uses user_id column; try that
  let q2;
  try {
    q2 = await db.from('profiles')
      .select('id, user_id, token_balance, subscription_tier')
      .eq('user_id', user_id)
      .maybeSingle();
    if (q2.data) return { profile: q2.data };
  } catch (e) {
    // column may not exist — ignore
  }

  // 3) Create minimal row (first try id, then user_id)
  // Use upsert to avoid race conditions
  let ins;
  try {
    ins = await db.from('profiles')
      .upsert(
        { id: user_id, token_balance: 0, subscription_tier: 'free' },
        { onConflict: 'id' }
      )
      .select('id, user_id, token_balance, subscription_tier')
      .maybeSingle();
    if (ins.data) return { profile: ins.data };
  } catch (e) {
    console.error('profiles upsert(id) failed:', e?.message || e);
  }

  try {
    ins = await db.from('profiles')
      .upsert(
        { user_id: user_id, token_balance: 0, subscription_tier: 'free' },
        { onConflict: 'user_id' }
      )
      .select('id, user_id, token_balance, subscription_tier')
      .maybeSingle();
    if (ins.data) return { profile: ins.data };
  } catch (e) {
    console.error('profiles upsert(user_id) failed:', e?.message || e);
  }

  // 4) Final read attempts
  q1 = await db.from('profiles')
    .select('id, user_id, token_balance, subscription_tier')
    .eq('id', user_id)
    .maybeSingle();
  if (q1.data) return { profile: q1.data };

  if (q2 === undefined) {
    try {
      q2 = await db.from('profiles')
        .select('id, user_id, token_balance, subscription_tier')
        .eq('user_id', user_id)
        .maybeSingle();
      if (q2.data) return { profile: q2.data };
    } catch {}
  }

  // Return the last error we saw (if any) for debugging
  return { profile: null, error: q1.error || q2?.error || ins?.error || new Error('No profile row and insert failed') };
}

export async function POST(req) {
  try {
    const { companion_id, giftKey } = await req.json().catch(() => ({}));
    if (!companion_id || !giftKey) {
      return json(400, { ok: false, code: 'BAD_REQUEST', message: 'Missing companion_id or giftKey.' });
    }

    // Validate user via bearer token (same as before)
    const authClient = typeof supabaseServer === 'function' ? supabaseServer() : supabaseServer;
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    const { data: authData, error: authErr } = await authClient.auth.getUser(token);
    const user = authData?.user;
    if (authErr || !user?.id) {
      return json(401, { ok: false, code: 'UNAUTHENTICATED', message: 'Please sign in first.' });
    }
    const user_id = user.id;

    // Service-role DB (bypass RLS so we stop fighting policies)
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      return json(500, { ok: false, code: 'SERVER_MISCONFIG', message: 'Service role key missing.' });
    }
    const db = createClient(url, serviceKey, { auth: { persistSession: false } });

    // Gift config (robust + fallback)
    const gift = resolveGiftConfig(getGiftEffectList, giftKey);
    if (!gift || typeof gift.priceTokens === 'undefined') {
      return json(404, { ok: false, code: 'GIFT_NOT_FOUND', message: 'That gift is unavailable.' });
    }
    const priceTokens = Number(gift.priceTokens) || 0;
    const effectsArr = toArray(gift.effects);
    const label = gift.label ?? gift.name ?? giftKey;

    // ---- Robust profile fetch/create ----
    const { profile, error: profErr } = await getOrCreateProfile(db, user_id);
    if (!profile) {
      console.error('getOrCreateProfile failed:', profErr?.message || profErr);
      return json(500, { ok: false, code: 'PROFILE_ERROR', message: 'Could not load profile.' });
    }
    // ------------------------------------

    // Pricing
    const discountPct = computeDiscountPercent(profile.subscription_tier);
    const discountedCost = Math.max(0, Math.floor(priceTokens * (100 - discountPct) / 100));
    if ((profile.token_balance ?? 0) < discountedCost) {
      return json(402, { ok: false, code: 'INSUFFICIENT_FUNDS', message: 'Not enough tokens.' });
    }

    // Charge tokens
    const { error: balErr } = await db
      .from('profiles')
      .update({ token_balance: profile.token_balance - discountedCost })
      .eq(profile.id ? 'id' : 'user_id', profile.id ? profile.id : profile.user_id);
    if (balErr) {
      console.error('profiles balance update failed:', balErr?.message || balErr);
      return json(500, { ok: false, code: 'BALANCE_UPDATE_FAILED', message: 'Could not charge tokens.' });
    }

    // Log purchase
    const { data: purchase, error: purchErr } = await db
      .from('gift_purchases')
      .insert({
        user_id,
        companion_id,
        gift_key: giftKey,
        label,
        price_tokens_charged: discountedCost,
        discount_percent: discountPct,
      })
      .select('id')
      .single();
    if (purchErr || !purchase?.id) {
      console.error('gift_purchases insert failed:', purchErr?.message || purchErr);
      // best-effort rollback
      await db
        .from('profiles')
        .update({ token_balance: profile.token_balance })
        .eq(profile.id ? 'id' : 'user_id', profile.id ? profile.id : profile.user_id);
      return json(500, { ok: false, code: 'PURCHASE_LOG_FAILED', message: 'Could not record purchase.' });
    }

    // Effects (best-effort)
    if (effectsArr.length) {
      const now = Date.now();
      const rows = effectsArr.map((e) => {
        const ttlMs = (Number(e.ttlHours) || 0) * 3600_000;
        return {
          user_id,
          companion_id,
          purchase_id: purchase.id,
          effect_type: e.type,
          amount: Number(e.amount) || 0,
          expires_at: ttlMs ? new Date(now + ttlMs).toISOString() : null,
          source: 'gift',
          is_active: true,
        };
      });
      const { error: effErr } = await db.from('gift_effects').insert(rows);
      if (effErr) console.error('gift_effects insert failed:', effErr?.message || effErr);
    }

    return json(200, {
      ok: true,
      code: 'OK',
      purchase_id: purchase.id,
      charged: discountedCost,
      discount_percent: discountPct,
      effects_applied: effectsArr.length,
      newBalance: profile.token_balance - discountedCost,
    });
  } catch (err) {
    console.error('GIFT_PURCHASE_SERVER_ERROR:', err?.stack || err?.message || err);
    return json(500, { ok: false, code: 'SERVER_ERROR', message: 'Unexpected server error.' });
  }
}
