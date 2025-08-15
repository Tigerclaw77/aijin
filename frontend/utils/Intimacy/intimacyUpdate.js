// /frontend/utils/Intimacy/intimacyUpdate.js
import { levelFromXP } from "./intimacyLevels";
import { getCapForSubTier, applyIntimacyCap, rankFromLevel } from "./intimacyCaps";

export function computeStatState({
  xp,
  curveParams,   // keep in signature in case you later add per-stat modifiers
  sub_tier,
  giftActive,
  nunLocked,
}) {
  const rawLevel = levelFromXP(xp); // ← now based on your thresholds
  const capInt   = getCapForSubTier(sub_tier);
  const level    = applyIntimacyCap(rawLevel, { subTierCapInt: capInt, giftActive, nunLocked });
  const rank     = rankFromLevel(level);
  return { rawLevel, level, rank };
}
