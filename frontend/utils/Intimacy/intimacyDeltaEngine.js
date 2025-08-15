// import { calculateGiftEffect, getTotalGiftBonus } from '../Chat-Gifts/giftUtils.js';

// // Rank-based intimacy growth curves
// export const growthCurves = {
//   2: (x) => 0.1667 * (1 / (1 + Math.exp(-10 * (x - 1)))),     // Steep sigmoid (late bloomer)
//   3: (x) => 0.1318 * (1 - Math.exp(-x)),                      // Exponential (balanced)
//   4: (x) => 0.1667 * (1 / (1 + Math.exp(-2 * (x - 1)))),      // Shallow sigmoid (warm/steady)
//   5: (x) => 0.1667 * (1 - 1 / (1 + Math.exp(-6 * (x - 1))))   // Inverse sigmoid (hot/fast)
// };

// /**
//  * Get multiplier based on message frequency
//  * @param {number} msgsPerDay
//  * @param {'verbal'|'physical'} type
//  * @returns {number}
//  */
// export function getMessageIntensityMultiplier(msgsPerDay, type = 'verbal') {
//   // You could customize per type if desired
//   if (msgsPerDay >= 27) return 1.3;
//   if (msgsPerDay >= 9) return 1.2;
//   if (msgsPerDay >= 3) return 1.1;
//   return 1.0;
// }

// /**
//  * Calculate total intimacy gain for the day
//  * @param {number} rank - Intimacy rank (2–5)
//  * @param {number} interactionScore - Daily interaction score
//  * @param {number} msgsPerDay - Messages sent by user
//  * @param {Array} giftList - Gift objects (with timestamp/decay)
//  * @param {Date} now - Timestamp
//  * @param {'verbal'|'physical'} type - Optional: verbal or physical
//  * @returns {number}
//  */
// export function calculateDailyIntimacyDelta(
//   rank,
//   interactionScore,
//   msgsPerDay,
//   giftList = [],
//   now = new Date(),
//   type = 'verbal'
// ) {
//   const growthFn = growthCurves[rank] || (() => 0);
//   const baseGrowth = growthFn(interactionScore);
//   const msgMultiplier = getMessageIntensityMultiplier(msgsPerDay, type);
//   const giftBonus = getTotalGiftBonus(giftList, now, type); // Optional: filter gifts by type

//   return baseGrowth * msgMultiplier + giftBonus;
// }
