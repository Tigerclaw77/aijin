// 🎁 Master gift catalog
export const giftCatalog = {
  tea: {
    value: 0.05,
    halfLife: 24,
    type: 'verbal',
    pauseDurationHours: 6,
  },
  coffee: {
    value: 0.10,
    halfLife: 24,
    type: 'physical',
    pauseDurationHours: 6,
  },
  boba: {
    value: 0.20,
    halfLife: 24,
    type: 'both',
    pauseDurationHours: 24,
  },
  energy_drink: {
    value: 0.50,
    halfLife: 6,
    type: 'both',
    pauseDurationHours: 12,
  },
  rose: {
    value: 0.30,
    halfLife: 72,
    type: 'verbal',
    pauseDurationHours: 24,
  },
  lingerie: {
    value: 0.40,
    halfLife: 72,
    type: 'physical',
    pauseDurationHours: 48,
  },
};

// Grabs gift data from Gift Shop
/**
 * Normalize raw gift data into internal format.
 * Accepts Supabase rows or manually constructed data.
 */
export function getGiftEffectList(giftsRaw = []) {
  return giftsRaw.map((gift) => ({
    id: gift.id || gift.gift_id,
    givenAt: new Date(gift.given_at || gift.timestamp),
  }));
}

// Caluclates current exp bonus from a gift
/**
 * Calculate the decayed bonus effect of a gift over time.
 * @param {number} initialValue
 * @param {number} tHours - Hours since given
 * @param {number} halfLife - Half-life in hours
 * @returns {number}
 */
export function calculateGiftEffect(initialValue, tHours, halfLife = 24) {
  const decayed = initialValue * Math.pow(0.5, tHours / halfLife);
  return decayed >= 0.05 * initialValue ? decayed : 0; // Drop tiny effects
}

//Calculates combined current exp bonuses from all gifts
/**
 * Sum total active gift bonus for a given intimacy type.
 * @param {Array} giftList - Normalized gift list
 * @param {Date} currentTime - Timestamp (default: now)
 * @param {'verbal'|'physical'} targetType
 * @param {number} residualCap - Max combined floor effect (default: 0.3)
 * @returns {number}
 */
export function getTotalGiftBonus(
  giftList = [],
  currentTime = new Date(),
  targetType = 'verbal'
) {
  let active = 0;

  for (const gift of giftList) {
    const giftMeta = giftCatalog[gift.id];
    if (!giftMeta) continue;

    const applies = giftMeta.type === targetType || giftMeta.type === 'both';
    if (!applies) continue;

    const tHours = (currentTime - gift.givenAt) / 3600000;
    const effect = calculateGiftEffect(giftMeta.value, tHours, giftMeta.halfLife);

    if (effect > 0) {
      active += effect;
    }
  }

  return active;
}

//Checks if any gift pause effect is active 
/**
 * Returns true if any gift has a paused decay window currently active.
 * @param {Array} giftList
 * @param {Date} now
 * @returns {boolean}
 */
export function isGiftEffectActive(giftList = [], now = new Date()) {
  return giftList.some((giftRaw) => {
    const id = giftRaw.id || giftRaw.gift_id;
    const ts = new Date(giftRaw.given_at || giftRaw.timestamp);
    const giftMeta = giftCatalog[id];
    if (!giftMeta?.pauseDurationHours) return false;

    const end = new Date(ts.getTime() + giftMeta.pauseDurationHours * 3600000);
    return now >= ts && now <= end;
  });
}

//Adds Gift exp bonus to base intimacy
/**
 * Simple wrapper to add baseLevel + giftBonus
 * @param {number} baseXP
 * @param {number} giftBonus
 * @returns {number}
 */
import { getIntimacyRank } from '../Intimacy/intimacyRankEngine.js';

export function getEffectiveIntimacyLevel(baseXP = 0, giftXP = 0) {
  return getIntimacyRank(baseXP + giftXP);
}

//Check for temporary level change due to gifts
/**
 * Determine the effective level from current XP and gift XP.
 * Returns a temporary level if the gift boosts it across a threshold.
 * @param {number} currentXP - Base XP from Supabase
 * @param {number} giftXP - Temporary XP boost from gifts
 * @returns {number} effective level (1–5)
 */
export function getEffectiveLevel(currentXP, giftXP = 0) {
  const totalXP = currentXP + giftXP;
  if (totalXP >= 5000) return 5;
  if (totalXP >= 3000) return 4;
  if (totalXP >= 1500) return 3;
  if (totalXP >= 500) return 2;
  return 1;
}
