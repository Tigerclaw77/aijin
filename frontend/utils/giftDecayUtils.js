// utils/giftDecayUtils.js

/**
 * Calculate total decayed XP from gift history for a specific intimacy type.
 *
 * @param {Array} giftData - Array of gift records with fields:
 *   - verbal_xp: number
 *   - physical_xp: number
 *   - half_life_hours: number
 *   - given_at: ISO string
 *   - type: "verbal" | "physical" | "both"
 * @param {string} intimacyType - "verbal" or "physical"
 * @param {Date} now - Optional override for current time
 * @returns {number} total decayed XP
 */
export function calculateGiftXP(giftData = [], intimacyType = "verbal", now = new Date()) {
  if (!Array.isArray(giftData)) return 0;

  return giftData.reduce((sum, gift) => {
    const affectsType =
      gift.type === intimacyType || gift.type === "both";
    if (!affectsType) return sum;

    const givenAt = new Date(gift.given_at);
    const hoursElapsed = (now - givenAt) / (1000 * 60 * 60);
    const decayFactor = Math.pow(0.5, hoursElapsed / gift.half_life_hours);

    const baseXP =
      intimacyType === "verbal"
        ? gift.verbal_xp || 0
        : intimacyType === "physical"
        ? gift.physical_xp || 0
        : 0;

    const decayedXP = baseXP * decayFactor;
    return sum + decayedXP;
  }, 0);
}
