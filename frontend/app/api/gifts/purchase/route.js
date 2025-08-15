// app/api/gifts/purchase/route.js
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseServer } from '../../../../utils/Supabase/supabaseServerClient';
import { getGiftEffectList } from '../../../../utils/Chat-Gifts/giftUtils';

function json(status, body) {
  return NextResponse.json(body, { status });
}

function computeDiscountPercent(tierLike) {
  const t = String(tierLike || '').toLowerCase();
  if (t === 'girlfriend') return 25;
  if (t === 'waifu') return 50;
  return 0;
}

// Local fallback for the 4 chat drinks so we’re not blocked by giftUtils shape
const LOCAL_DEFAULTS = {
  tea: {
    id: 'tea',
    label: 'Tea',
    priceTokens: 100,
    effects: [{ type: 'messages', amount: 10, ttlHours: 0 }],
  },
  coffee: {
    id: 'coffee',
    label: 'Coffee',
    priceTokens: 200,
    effects: [{ type: 'messages', amount: 25, ttlHours: 0 }],
  },
  boba: {
    id: 'boba',
    label: 'Boba',
    priceTokens: 300,
    effects: [{ type: 'unlimited_chat', amount: 1, ttlHours: 12 }],
  },
  energy_drink: {
    id: 'energy_drink',
    label: 'Energy Drink',
    priceTokens: 400,
    effects: [{ type: 'unlimited_chat', amount: 1, ttlHours: 24 }],
  },
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
  if (Array.isArray(raw))
    return (
      raw.find((x) => x?.id === key || x?.key === key || x?.name === key || x?.label === key) ||
      null
    );
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

// robust profile loader (id is generated/read-only — NEVER write it)
async function getOrCreateProfile(db, user_id) {
  // 1) Try by generated id (read-only)
  let q1 = await db
    .from('profiles')
    .select('id, user_id, tokens')
    .eq('id', user_id)
    .maybeSingle();
  if (q1.data) return { profile: q1.data };

  // 2) Try by user_id (writable key)
  let q2 = await db
    .from('profiles')
    .select('id, user_id, tokens')
    .eq('user_id', user_id)
    .maybeSingle();
  if (q2.data) return { profile: q2.data };

  // 3) Create a minimal row keyed by user_id (do NOT assign id)
  let ins = await db
    .from('profiles')
    .upsert({ user_id: user_id, tokens: 0 }, { onConflict: 'user_id' })
    .select('id, user_id, tokens')
    .maybeSingle();
  if (ins.data) return { profile: ins.data };

  // 4) Final read attempts
  q1 = await db
    .from('profiles')
    .select('id, user_id, tokens')
    .eq('id', user_id)
    .maybeSingle();
  if (q1.data) return { profile: q1.data };

  q2 = await db
    .from('profiles')
    .select('id, user_id, tokens')
    .eq('user_id', user_id)
    .maybeSingle();
  if (q2.data) return { profile: q2.data };

  return {
    profile: null,
    error: ins.error || q1.error || q2.error || new Error('No profile row and insert failed'),
  };
}

export async function POST(req) {
  try {
    const { companion_id, giftKey } = await req.json().catch(() => ({}));
    if (!companion_id || !giftKey) {
      return json(400, {
        ok: false,
        code: 'BAD_REQUEST',
        message: 'Missing companion_id or giftKey.',
      });
    }

    // Validate user via bearer token
    const authClient = typeof supabaseServer === 'function' ? supabaseServer() : supabaseServer;
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    const { data: authData, error: authErr } = await authClient.auth.getUser(token);
    const user = authData?.user;
    if (authErr || !user?.id) {
      return json(401, { ok: false, code: 'UNAUTHENTICATED', message: 'Please sign in first.' });
    }
    const user_id = user.id;

    // Service-role DB
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      return json(500, {
        ok: false,
        code: 'SERVER_MISCONFIG',
        message: 'Service role key missing.',
      });
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

    // ---- Load profile (tokens) ----
    const { profile, error: profErr } = await getOrCreateProfile(db, user_id);
    if (!profile) {
      console.error('getOrCreateProfile failed:', profErr?.message || profErr);
      return json(500, { ok: false, code: 'PROFILE_ERROR', message: 'Could not load profile.' });
    }

    // ---- Load companion tier for discount ----
    const { data: comp, error: compErr } = await db
      .from('companions')
      .select('subscription_tier, sub_tier')
      .eq('companion_id', companion_id)
      .maybeSingle();
    if (compErr) console.error('companions read failed:', compErr?.message || compErr);
    const tierForDiscount = comp?.subscription_tier ?? comp?.sub_tier ?? null;
    const discountPct = computeDiscountPercent(tierForDiscount);
    // -----------------------------------------

    // Pricing
    const discountedCost = Math.max(0, Math.floor((priceTokens * (100 - discountPct)) / 100));
    if ((profile.tokens ?? 0) < discountedCost) {
      return json(402, { ok: false, code: 'INSUFFICIENT_FUNDS', message: 'Not enough tokens.' });
    }

    // Charge tokens (match by user_id ONLY — never write to generated id)
    const { error: balErr } = await db
      .from('profiles')
      .update({ tokens: profile.tokens - discountedCost })
      .eq('user_id', profile.user_id || user_id);
    if (balErr) {
      console.error('profiles balance update failed:', balErr?.message || balErr);
      return json(500, {
        ok: false,
        code: 'BALANCE_UPDATE_FAILED',
        message: 'Could not charge tokens.',
      });
    }

    // Log purchase (best-effort; do NOT fail if it can't return id)
    let purchaseId = null;
    try {
      const insertRes = await db
        .from('gift_purchases')
        .insert({
          user_id,
          companion_id,
          gift_key: giftKey,
          label,
          price_tokens_charged: discountedCost,
          discount_percent: discountPct,
        })
        .select('*')                // be tolerant of schema
        .maybeSingle();             // don't throw if empty

      // insertRes.data might be an object, array, or null depending on schema/returning
      const d = insertRes?.data;
      purchaseId =
        (d && typeof d === 'object' && !Array.isArray(d) && (d.id || d.purchase_id)) ||
        (Array.isArray(d) && d[0] && (d[0].id || d[0].purchase_id)) ||
        null;

      if (!purchaseId && insertRes?.error) {
        console.error('gift_purchases insert error:', insertRes.error);
      } else if (!purchaseId) {
        console.warn('gift_purchases insert returned no id; continuing without it');
      }
    } catch (e) {
      console.error('gift_purchases insert threw:', e?.message || e);
    }

    // Effects (best-effort)
    if (effectsArr.length) {
      const now = Date.now();
      const rows = effectsArr.map((e) => {
        const ttlMs = (Number(e.ttlHours) || 0) * 3600_000;
        return {
          user_id,
          companion_id,
          purchase_id: purchaseId, // may be null; keep nullable in schema if you want
          effect_type: e.type,
          amount: Number(e.amount) || 0,
          expires_at: ttlMs ? new Date(now + ttlMs).toISOString() : null,
          source: 'gift',
          is_active: true,
        };
      });
      try {
        const { error: effErr } = await db.from('gift_effects').insert(rows);
        if (effErr) console.error('gift_effects insert failed:', effErr?.message || effErr);
      } catch (e) {
        console.error('gift_effects insert threw:', e?.message || e);
      }
    }

    return json(200, {
      ok: true,
      code: 'OK',
      purchase_id: purchaseId,
      charged: discountedCost,
      discount_percent: discountPct,
      effects_applied: effectsArr.length,
      newBalance: profile.tokens - discountedCost,
    });
  } catch (err) {
    console.error('GIFT_PURCHASE_SERVER_ERROR:', err?.stack || err?.message || err);
    return json(500, { ok: false, code: 'SERVER_ERROR', message: 'Unexpected server error.' });
  }
}
