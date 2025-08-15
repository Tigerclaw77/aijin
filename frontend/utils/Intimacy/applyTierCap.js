// utils/Intimacy/applyTierCap.js
export const MIN_INTIMACY = 1;
export const EPS = 1e-6;

/**
 * Clamp a fractional intimacy level:
 * - minimum 1
 * - whole-number tier cap N -> effective level < N+1
 * - optional additive gift boost applied before clamping
 */
export function applyTierCap(level, tier, getMaxForTier, boost = 0) {
  const raw = Number(level ?? MIN_INTIMACY);
  const add = Number.isFinite(boost) ? boost : 0;
  let v = raw + add;
  if (!Number.isFinite(v)) v = MIN_INTIMACY;

  const lower = MIN_INTIMACY;
  const maxWhole = getMaxForTier ? Number(getMaxForTier(String(tier))) : Infinity;
  const upper = Number.isFinite(maxWhole) ? maxWhole + 1 - EPS : Infinity;

  return Math.max(lower, Math.min(v, upper));
}

export function toArchetypeBand(level) {
  return Math.floor(Number(level ?? MIN_INTIMACY));
}

export default applyTierCap;
