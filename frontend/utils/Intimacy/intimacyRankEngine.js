// // intimacyRankEngine.js

// export function getXPThresholdForLevel(level = 1) {
//   return intimacyXPThresholds[level] ?? Infinity;
// }

// export const intimacyXPThresholds = {
//   1: 0,     // Rank 1 starts at 0 XP
//   2: 0.5,   // Rank 2 starts at 0.5 XP
//   3: 1.5,   // Rank 3 starts at 1.5 XP
//   4: 3.0,   // Rank 4 starts at 3.0 XP
//   5: 5.5,   // Rank 5 starts at 5.5 XP
// };

// /**
//  * Get the intimacy rank based on current XP.
//  * @param {number} xp - current XP value
//  * @returns {number} rank from 1 to 5
//  */
// export function getIntimacyRank(xp = 0) {
//   const thresholds = Object.entries(intimacyXPThresholds)
//     .map(([rank, threshold]) => [parseInt(rank), threshold])
//     .sort((a, b) => a[0] - b[0]); // Ensure sorted by rank

//   for (let i = thresholds.length - 1; i >= 0; i--) {
//     const [rank, threshold] = thresholds[i];
//     if (xp >= threshold) return rank;
//   }

//   return 1;
// }

// /**
//  * Get how much XP is needed to reach the next rank from current XP.
//  * @param {number} xp - current XP value
//  * @returns {object} { currentRank, nextRank, xpToNext }
//  */
// export function getNextIntimacyRankInfo(xp = 0) {
//   const currentRank = getIntimacyRank(xp);
//   const currentThreshold = intimacyXPThresholds[currentRank];
//   const nextRank = currentRank < 5 ? currentRank + 1 : 5;
//   const nextThreshold = intimacyXPThresholds[nextRank];

//   return {
//     currentRank,
//     nextRank,
//     xpToNext: Math.max(0, nextThreshold - xp),
//   };
// }

// /frontend/utils/Intimacy/intimacyRankEngine.js (shim; optional; temporary)
export { INTIMACY_XP_THRESHOLDS as intimacyXPThresholds } from "./intimacyLevels";
export { getXPThresholdForLevel } from "./intimacyLevels";
export function getIntimacyRank(xp = 0) {
  const { rank } = getNextIntimacyRankInfo(xp);
  return rank;
}
export function getNextIntimacyRankInfo(xp = 0) {
  const info = getNextLevelInfoFromXP(xp);
  return { currentRank: info.rank, nextRank: info.nextRank, xpToNext: info.xpToNext };
}
