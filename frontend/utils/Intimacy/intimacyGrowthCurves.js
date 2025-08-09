/**
 * Growth curves for intimacy score (curveType: 2–5).
 * Each curve returns XP/day when x is normalized to [0,1] (0 = day 0, 1 = day 60).
 */
export const growthCurves = {
  2: (x) => 0.1667 * (1 / (1 + Math.exp(-10 * (x - 1)))), // Late bloomer
  3: (x) => 0.1318 * x, // Linear (balanced)
  4: (x) => 0.1667 * (1 / (1 + Math.exp(-2 * (x - 1)))), // Gentle warmth
  5: (x) => 0.1667 * (1 - 1 / (1 + Math.exp(-6 * (x - 1)))), // Fast passion
};

/**
 * Message activity multiplier for growth.
 * Boosts XP based on user activity volume.
 */
export function getMessageIntensityMultiplier(msgsPerDay = 1) {
  if (msgsPerDay >= 27) return 1.3;
  if (msgsPerDay >= 9) return 1.2;
  if (msgsPerDay >= 3) return 1.1;
  return 1.0;
}

/**
 * Calculate XP delta from growth curve, message activity, and gifts.
 * @param {Object} params
 * @param {number} params.curveType - 2–5
 * @param {number} params.interactionX - normalized value from 0 (day 0) to 1 (day 60)
 * @param {number} params.msgsToday - messages sent today
 * @param {number} [params.giftBonus=0] - bonus XP from gifts
 * @returns {number} intimacy XP delta for today
 */
export function calculateDailyIntimacyDelta({ curveType, interactionX, msgsToday, giftBonus = 0 }) {
  const curveFn = growthCurves[curveType] || (() => 0);
  const baseGrowth = curveFn(interactionX);
  const multiplier = getMessageIntensityMultiplier(msgsToday);
  const delta = baseGrowth * multiplier + giftBonus;

  return parseFloat(delta.toFixed(4));
}

export function calculateDecayAmount(rank, daysInactive) {
  const baseDecay =
    {
      2: 0.01,
      3: 0.03,
      4: 0.06,
      5: 0.1,
    }[rank] || 0;

  return baseDecay * daysInactive;
}
