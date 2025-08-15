export const MIN_INTIMACY = 1;
export const EPS = 1e-6;

// ✅ Your mapping (unchanged from your message)
export function getCapForSubTier(sub_tier) {
  switch ((sub_tier || "").toLowerCase()) {
    case "free":        return 1; // <2
    case "friend":      return 2; // <3
    case "crush":       return 3; // <4
    case "girlfriend":  return 4; // <5
    case "waifu":       return 5; // <6
    default:            return 2; // safe fallback
  }
}

/**
 * Gifts override caps; Nun-lock (created at 1, still locked) forces <2; otherwise sub_tier.
 * Returns a float upper bound or null if giftActive.
 */
export function getEffectiveCap({ subTierCapInt, giftActive, nunLocked }) {
  if (giftActive) return null;         // gifts temporarily remove upper cap
  if (nunLocked)  return 2 - EPS;      // nun-lock holds under 2
  const safe = Math.max(1, Math.min(5, Math.floor(subTierCapInt || 1)));
  return (safe + 1) - EPS;             // e.g., 4 -> 4.999999
}

export function applyIntimacyCap(level, opts) {
  const lb  = Math.max(MIN_INTIMACY, Number(level) || 0);
  const cap = getEffectiveCap(opts);
  if (cap == null) return lb;          // gift active → no upper clamp
  return Math.min(lb, cap);
}

export function rankFromLevel(level) {
  const floored = Math.floor(Number(level) || 0);
  return /** @type {1|2|3|4|5} */ (Math.max(1, Math.min(5, floored)));
}
