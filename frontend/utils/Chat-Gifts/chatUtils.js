// utils/Chat-Gifts/chatUtils.js
// Single source of truth for chat tier + gift helpers.
// - NO "premium" tier anywhere.
// - NO +/- diffing.
// - Defensive against null/undefined inputs.

import { normalizeTier } from '../subscription/getVerifiedTier';

const VALID_TIERS = new Set([
  'sample',
  'free',
  'friend',
  'crush',
  'girlfriend',
  'waifu',
  'harem',
]);

/**
 * Normalize a tier from either a profile object or a raw string.
 * Guests should be handled by caller; default here is "free".
 */
export function getUserTier(profileOrTier) {
  // Raw string case
  if (typeof profileOrTier === 'string') {
    const t = normalizeTier(profileOrTier)?.toLowerCase?.() || 'free';
    return VALID_TIERS.has(t) ? t : 'free';
  }

  // Profile object (may be undefined/null)
  const p = profileOrTier || {};
  const raw =
    p.subscription_tier ??
    p.sub_tier ??
    p.tier ??
    'free';

  const t = normalizeTier(raw)?.toLowerCase?.() || 'free';
  return VALID_TIERS.has(t) ? t : 'free';
}

/**
 * Gift unlocks + status flags derived from the user's profile.
 * - Returns current drink unlock counters (if you track them).
 * - Computes bobaActive from either `unlocked_boba_until` (preferred) or
 *   `unlocked_boba_at` + 24h fallback.
 * - Adds per-tier drink discounts (requested: 25% girlfriend, 50% waifu/harem).
 */
export function getGiftUnlocks(profileOrTier) {
  const tier = getUserTier(profileOrTier);
  const p = (typeof profileOrTier === 'object' && profileOrTier) ? profileOrTier : {};

  // Existing counters (treat missing as 0)
  const unlocks = {
    tea: Number.isFinite(p?.unlocks_tea) ? p.unlocks_tea : 0,
    coffee: Number.isFinite(p?.unlocks_coffee) ? p.unlocks_coffee : 0,
    boba: Number.isFinite(p?.unlocks_boba) ? p.unlocks_boba : 0,
  };

  // Runtime boba "unlimited" flag: prefer an explicit UNTIL timestamp if present,
  // otherwise treat unlocked_boba_at + 24h as active.
  let bobaActive = false;
  try {
    const nowMs = Date.now();
    const untilIso = p?.unlocked_boba_until; // e.g., "2025-08-14T16:00:00.000Z"
    if (untilIso) {
      bobaActive = nowMs < new Date(untilIso).getTime();
    } else if (p?.unlocked_boba_at) {
      const since = new Date(p.unlocked_boba_at).getTime();
      bobaActive = Number.isFinite(since) && (nowMs - since) < 24 * 60 * 60 * 1000;
    }
  } catch {
    bobaActive = false;
  }

  // Per-tier drink discounts
  let drinkDiscount = 0; // 0..1
  if (tier === 'girlfriend') drinkDiscount = 0.25;
  if (tier === 'waifu' || tier === 'harem') drinkDiscount = 0.5;

  return {
    ...unlocks,
    bobaActive,
    discounts: {
      drinks: drinkDiscount,
    },
  };
}

/**
 * Optional helper if you want a central place for caps.
 * Keep aligned with the hook if you wire it in.
 */
export function getTierCap(tierOrProfile) {
  const tier = getUserTier(tierOrProfile);
  switch (tier) {
    case 'sample': return 3;
    case 'free': return 5;
    case 'friend': return 50;
    default: return Infinity;
  }
}
