
// intimacyDecayCurves.js

/**
 * All decay functions take normalized input x (0 to 1) and output multiplier (1.0 to ~0.2)
 * Where x = daysSinceLastInteraction / 50
 */

export const decayCurves = {
  2: (x) => 1.0 - 0.8 * Math.pow(x, 0.4), // Loyal: slow decay
  3: (x) => 1.0 - 0.8 * x,               // Balanced: linear decay
  4: (x) => 1.0 - 0.8 * Math.pow(x, 1.5), // Romantic: moderately fast early decay
  5: (x) => 1.0 - 0.8 * Math.pow(x, 2.5), // Volatile: fast early drop, slow later
};

/**
 * Get decay multiplier for a specific intimacy curve
 * @param {number} curveType - 2, 3, 4, or 5
 * @param {number} daysSinceLast - Number of days since last interaction
 * @returns {number} multiplier (0.2–1.0)
 */
export function getDecayMultiplier(curveType, daysSinceLast) {
  const normalized = Math.min(Math.max(daysSinceLast / 50, 0), 1);
  const fn = decayCurves[curveType];
  return fn ? parseFloat(fn(normalized).toFixed(4)) : 1.0;
}
