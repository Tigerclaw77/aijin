import { calculateDailyIntimacyDelta } from './intimacyEngine.js';
import { getDecayPenalty, applyDecay } from './intimacyDecay.js';

/**
 * Process daily intimacy update based on activity, gift, and pause status.
 *
 * @param {Object} companionState - Current state of the companion
 * @param {number} companionState.rank - Intimacy rank (2–5)
 * @param {number} companionState.currentIntimacy - Current internal intimacy value
 * @param {boolean} companionState.isPaused - True if carbonited/paused (no decay or growth)
 * @param {number} companionState.daysInactive - Days since last user interaction
 * @param {number} companionState.messagesToday - Number of messages user sent today
 * @param {number} companionState.interactionScore - Daily interaction score (effort multiplier)
 * @param {Array} companionState.giftList - List of gifts
 * @param {Date} now - Optional timestamp (defaults to now)
 * @returns {number} - New intimacy value after daily processing
 */
export function processDailyIntimacy(companionState, now = new Date()) {
  const {
    rank,
    currentIntimacy,
    isPaused,
    daysInactive,
    messagesToday,
    interactionScore,
    giftList
  } = companionState;

  if (isPaused) return currentIntimacy; // No update while paused

  const gain = calculateDailyIntimacyDelta(
    rank,
    interactionScore,
    messagesToday,
    giftList,
    now
  );

  const decay = getDecayPenalty(rank, daysInactive);
  const postDecay = applyDecay(currentIntimacy, decay);

  const newIntimacy = Math.min(postDecay + gain, 6.0);
  return newIntimacy;
}
