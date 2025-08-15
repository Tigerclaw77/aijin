// utils/Chat-Gifts/giftUtils.js

// 🎁 Master gift catalog
export const giftCatalog = {
  tea:         { value: 0.05, halfLife: 24, type: 'verbal',   pauseDurationHours: 6  },
  coffee:      { value: 0.10, halfLife: 24, type: 'physical', pauseDurationHours: 6  },
  boba:        { value: 0.20, halfLife: 24, type: 'both',     pauseDurationHours: 24 },
  energy_drink:{ value: 0.50, halfLife: 6,  type: 'both',     pauseDurationHours: 12 },
  rose:        { value: 0.30, halfLife: 72, type: 'verbal',   pauseDurationHours: 24 },
  lingerie:    { value: 0.40, halfLife: 72, type: 'physical', pauseDurationHours: 48 },
};

// ■ Normalize raw rows from Supabase (or manual objects) → internal format
export function getGiftEffectList(giftsRaw = []) {
  return giftsRaw.map((gift) => ({
    id: gift.id || gift.gift_id,
    givenAt: new Date(gift.given_at || gift.timestamp),
  }));
}

/**
 * Pure decay (no pause-window) — kept for reuse/clarity.
 * @param {number} initialValue
 * @param {number} tHours - hours since start of decay
 * @param {number} halfLife - half-life in hours
 * @returns {number}
 */
export function calculateGiftEffect(initialValue, tHours, halfLife = 24) {
  const decayed = initialValue * Math.pow(0.5, tHours / halfLife);
  return decayed >= 0.05 * initialValue ? decayed : 0; // drop tiny tail
}

/**
 * Effect at a timestamp, honoring pause windows before decay starts.
 * @param {string} giftId
 * @param {Date} givenAt
 * @param {Date} now
 * @returns {number}
 */
export function effectAtTime(giftId, givenAt, now = new Date()) {
  const meta = giftCatalog[giftId];
  if (!meta) return 0;

  const dtHours = (now - givenAt) / 3600000;
  const pause = meta.pauseDurationHours || 0;

  if (dtHours <= pause) {
    // still in pause window → full effect
    return meta.value;
  }
  // decay starts after pause
  const t = dtHours - pause;
  return calculateGiftEffect(meta.value, t, meta.halfLife);
}

/**
 * Sum total active gift bonus for a given intimacy type.
 * type can be 'verbal' | 'physical' | 'both'
 */
export function getTotalGiftBonus(
  giftList = [],
  currentTime = new Date(),
  targetType = 'verbal'
) {
  let active = 0;
  for (const gift of giftList) {
    const meta = giftCatalog[gift.id];
    if (!meta) continue;

    const applies =
      targetType === 'both' ||
      meta.type === targetType ||
      meta.type === 'both';

    if (!applies) continue;

    const v = effectAtTime(gift.id, gift.givenAt, currentTime);
    if (v > 0) active += v;
  }
  return active;
}

/** Any gift still inside its pause window? */
export function isGiftEffectActive(giftList = [], now = new Date()) {
  return giftList.some((giftRaw) => {
    const id = giftRaw.id || giftRaw.gift_id;
    const ts = new Date(giftRaw.given_at || giftRaw.timestamp);
    const meta = giftCatalog[id];
    if (!meta?.pauseDurationHours) return false;
    const end = new Date(ts.getTime() + meta.pauseDurationHours * 3600000);
    return now >= ts && now <= end;
  });
}

// --- XP/Level helpers you already had (kept for compatibility) ---
import { getIntimacyRank } from '../Intimacy/intimacyRankEngine.js';

export function getEffectiveIntimacyLevel(baseXP = 0, giftXP = 0) {
  return getIntimacyRank(baseXP + giftXP);
}

export function getEffectiveLevel(currentXP, giftXP = 0) {
  const totalXP = currentXP + giftXP;
  if (totalXP >= 5000) return 5;
  if (totalXP >= 3000) return 4;
  if (totalXP >= 1500) return 3;
  if (totalXP >= 500)  return 2;
  return 1;
}

/**
 * 🔧 Compat shim for older code that used a single "calculateGiftXP".
 * Returns a bounded sum across BOTH types.
 */
export function calculateGiftXP(gifts = [], now = new Date()) {
  const list = getGiftEffectList(gifts);
  // Treat the summed effect as a *level* boost; clamp to something sane.
  const total = getTotalGiftBonus(list, now, 'both');
  return Math.min(total, 1.0);
}
