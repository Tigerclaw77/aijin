import { calculateDailyIntimacyDelta } from './intimacyEngine';
import { getDecayPenalty, applyDecay } from './intimacyDecay';

/**
 * Generalized update logic for a single intimacy type (verbal or physical)
 *
 * @param {Object} params
 * @param {'verbal'|'physical'} params.type - Intimacy category
 * @param {number} params.rank - Intimacy rank (2–5)
 * @param {number} params.currentIntimacy - Current intimacy value (0.0–6.0)
 * @param {boolean} params.isPaused - If true, bypass growth/decay
 * @param {number} params.daysInactive - Days since last interaction
 * @param {number} params.messagesToday - Messages sent today
 * @param {number} params.interactionScore - Normalized effort/quality
 * @param {Array} params.giftList - Gift objects with metadata
 * @param {Date} [params.now] - Optional timestamp override
 * @returns {number} - New intimacy value (max 6.0)
 */
export function processSingleIntimacy({
  type,
  rank,
  currentIntimacy,
  isPaused,
  daysInactive,
  messagesToday,
  interactionScore,
  giftList,
  now = new Date(),
}) {
  if (isPaused) return currentIntimacy;

  const gain = calculateDailyIntimacyDelta(
    rank,
    interactionScore,
    messagesToday,
    giftList,
    now,
    type
  );

  const decay = getDecayPenalty(rank, daysInactive);
  const postDecay = applyDecay(currentIntimacy, decay);

  const newIntimacy = Math.min(postDecay + gain, 6.0);
  return newIntimacy;
}

/**
 * Wrapper for verbal intimacy processing
 *
 * @param {Object} companionState - Same shape as processSingleIntimacy input, without `type`
 * @param {Date} [now] - Optional override timestamp
 * @returns {number}
 */
export function processVerbalIntimacy(companionState, now = new Date()) {
  return processSingleIntimacy({
    ...companionState,
    type: 'verbal',
    now,
  });
}

/**
 * Wrapper for physical intimacy processing
 *
 * @param {Object} companionState - Same shape as processSingleIntimacy input, without `type`
 * @param {Date} [now] - Optional override timestamp
 * @returns {number}
 */
export function processPhysicalIntimacy(companionState, now = new Date()) {
  return processSingleIntimacy({
    ...companionState,
    type: 'physical',
    now,
  });
}
