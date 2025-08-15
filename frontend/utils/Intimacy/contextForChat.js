import { computeStatState } from "./intimacyUpdate";
import { permissionsForRank } from "./permissions";

export function buildIntimacyContext({
  pairing,          // row from user_companions
  giftState,        // { verbal: boolean, physical: boolean }
  curves,           // { verbal: {...}, physical: {...} } curve params
}) {
  const sub_tier = pairing.subscription_tier;

  const verbal = computeStatState({
    xp: pairing.verbal_xp || 0,
    curveParams: curves.verbal,
    sub_tier,
    giftActive: !!giftState.verbal,
    nunLocked: (pairing.created_with_verbal1 && !pairing.verbal_unlocked)
  });

  const physical = computeStatState({
    xp: pairing.physical_xp || 0,
    curveParams: curves.physical,
    sub_tier,
    giftActive: !!giftState.physical,
    nunLocked: (pairing.created_with_physical1 && !pairing.physical_unlocked)
  });

  // You can pick how to combine; commonly the lower of the two for risk, or verbal-first
  const dominantRank = Math.min(verbal.rank, physical.rank);
  const perms = permissionsForRank(dominantRank);

  return {
    sub_tier,
    verbal,          // { rawLevel, level, rank }
    physical,        // { rawLevel, level, rank }
    rankForGating: dominantRank,
    permissions: perms
  };
}
