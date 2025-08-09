// utils/Intimacy/intimacyDecay.js

/**
 * Returns a decay multiplier for intimacy loss based on number of inactive days.
 * Each rank (2–5) has a unique decay profile. These are NOT mirror images of the growth curves,
 * but rather inverse-shaped (e.g. fast warm = fast fade).
 *
 * @param {number} rank - Intimacy rank (2–5)
 * @param {number} daysInactive - Days since last interaction
 * @returns {number} - Decay multiplier (to subtract from internal intimacy)
 */
export function getDecayPenalty(rank, daysInactive) {
  if (daysInactive < 1) return 0; // No decay within 24h

  switch (rank) {
    case 2: // Late bloomer — slow to cool off
      return Math.min(0.02 * Math.log1p(daysInactive), 0.3);
    case 3: // Balanced — linear fade
      return Math.min(0.04 * daysInactive, 0.4);
    case 4: // Warm and steady — ramps down over time
      return Math.min(0.05 * Math.sqrt(daysInactive), 0.45);
    case 5: // Hot and fast — loses intimacy rapidly
      return Math.min(0.08 * Math.pow(daysInactive, 1.2), 0.6);
    default:
      return 0;
  }
}

/**
 * Apply decay to current internal intimacy level.
 *
 * @param {number} currentIntimacy - Internal intimacy value (float)
 * @param {number} decay - Daily decay penalty
 * @param {number} minFloor - Optional floor (e.g. 1.0)
 * @returns {number} - New intimacy value
 */
export function applyDecay(currentIntimacy, decay, minFloor = 0.5) {
  return Math.max(currentIntimacy - decay, minFloor);
}
