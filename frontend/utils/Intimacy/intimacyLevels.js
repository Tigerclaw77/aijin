// /frontend/utils/Intimacy/intimacyLevels.js

// Non-linear XP thresholds for the level integer boundaries (your data)
export const INTIMACY_XP_THRESHOLDS = {
  1: 0.0,   // Rank 1 starts at 0 XP
  2: 0.5,   // Rank 2 starts at 0.5 XP
  3: 1.5,   // Rank 3 starts at 1.5 XP
  4: 3.0,   // Rank 4 starts at 3.0 XP
  5: 5.5,   // Rank 5 starts at 5.5 XP
};

/**
 * Return the XP threshold at which integer level N begins.
 * For N outside 1..5, returns Infinity (above max) or 0 (below min) appropriately.
 */
export function getXPThresholdForLevel(level = 1) {
  const L = Math.floor(level);
  if (L <= 1) return INTIMACY_XP_THRESHOLDS[1] ?? 0;
  if (L >= 5) return INTIMACY_XP_THRESHOLDS[5] ?? Infinity;
  return INTIMACY_XP_THRESHOLDS[L] ?? Infinity;
}

/**
 * Map XP → a continuous level whose integer boundaries match your thresholds.
 * - If XP < T2, level ∈ [1,2)
 * - If T2 ≤ XP < T3, level ∈ [2,3)
 * - ...
 * We linearly interpolate *between thresholds* so growth between ranks is smooth.
 */
export function levelFromXP(xpRaw) {
  const xp = Math.max(0, Number(xpRaw) || 0);

  const T1 = INTIMACY_XP_THRESHOLDS[1];
  const T2 = INTIMACY_XP_THRESHOLDS[2];
  const T3 = INTIMACY_XP_THRESHOLDS[3];
  const T4 = INTIMACY_XP_THRESHOLDS[4];
  const T5 = INTIMACY_XP_THRESHOLDS[5];

  // Below rank 2 start
  if (xp < T2) {
    const span = Math.max(1e-9, T2 - T1);
    const frac = (xp - T1) / span;
    return 1 + clamp01(frac); // [1,2)
  }
  // [2,3)
  if (xp < T3) {
    const span = Math.max(1e-9, T3 - T2);
    const frac = (xp - T2) / span;
    return 2 + clamp01(frac); // [2,3)
  }
  // [3,4)
  if (xp < T4) {
    const span = Math.max(1e-9, T4 - T3);
    const frac = (xp - T3) / span;
    return 3 + clamp01(frac); // [3,4)
  }
  // [4,5)
  if (xp < T5) {
    const span = Math.max(1e-9, T5 - T4);
    const frac = (xp - T4) / span;
    return 4 + clamp01(frac); // [4,5)
  }

  // At/above rank 5 threshold: continue to increase smoothly above 5
  // (rank UI will still cap at 5; gifts/caps handle the rest)
  const span5 = Math.max(1e-9, T5 - T4);
  const frac5 = (xp - T5) / span5; // reuse span to keep slope reasonable
  return 5 + Math.max(0, frac5);
}

/** Convenience helpers */
export function getIntimacyRankFromXP(xp) {
  // rank = floor(level)
  return Math.max(1, Math.min(5, Math.floor(levelFromXP(xp))));
}

export function getNextLevelInfoFromXP(xpRaw) {
  const level = levelFromXP(xpRaw);
  const rank = Math.max(1, Math.min(5, Math.floor(level)));
  const nextRank = Math.min(5, rank + 1);
  const currentThreshold = getXPThresholdForLevel(rank);
  const nextThreshold =
    nextRank > 5 ? Infinity : INTIMACY_XP_THRESHOLDS[nextRank];

  return {
    level,
    rank,
    nextRank,
    xpToNext:
      Number.isFinite(nextThreshold) ? Math.max(0, nextThreshold - (Number(xpRaw) || 0)) : Infinity,
    currentThreshold,
    nextThreshold,
  };
}

function clamp01(x) {
  return Math.min(1, Math.max(0, x));
}
