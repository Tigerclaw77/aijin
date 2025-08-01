/**
 * Define the master gift catalog.
 * Each gift defines:
 * - value: initial bonus
 * - halfLife: in hours (not days)
 * - type: 'verbal' | 'physical' | 'both'
 * - minContribution: used after full decay (optional)
 */
export const giftCatalog = {
  tea: {
    value: 0.05,
    halfLife: 24,
    type: 'verbal',
    minContribution: 0.01,
  },
  coffee: {
    value: 0.10,
    halfLife: 24,
    type: 'physical',
    minContribution: 0.01,
  },
  boba: {
    value: 0.20,
    halfLife: 24,
    type: 'both',
    minContribution: 0.02,
  },
  energy_drink: {
    value: 0.50,
    halfLife: 6,
    type: 'both',
    minContribution: 0.02,
  },
  rose: {
    value: 0.30,
    halfLife: 72,
    type: 'verbal',
    minContribution: 0.03,
  },
  lingerie: {
    value: 0.40,
    halfLife: 72,
    type: 'physical',
    minContribution: 0.05,
  },
};

/**
 * Calculate the decayed effect of a gift based on time and half-life.
 */
export function calculateGiftEffect(initialValue, tHours, halfLife = 24) {
  const decayed = initialValue * Math.pow(0.5, tHours / halfLife);
  return decayed >= 0.05 * initialValue ? decayed : 0; // Drop tiny effects
}

/**
 * Converts raw gift objects to consistent internal structure.
 * Accepts [{ id: 'tea', given_at: Date }] or Supabase rows.
 */
export function getGiftEffectList(giftsRaw = []) {
  return giftsRaw.map((gift) => ({
    id: gift.id || gift.gift_id,
    givenAt: new Date(gift.given_at || gift.timestamp),
  }));
}

/**
 * Sum the total current effective bonus for a given intimacy type.
 *
 * @param {Array} giftList - List of gift objects (normalized by getGiftEffectList)
 * @param {Date} currentTime - Defaults to now
 * @param {'verbal'|'physical'} targetType
 * @param {number} residualCap - Max contribution from fully decayed gifts (default 0.3)
 * @returns {number} total bonus
 */
export function getTotalGiftBonus(giftList, currentTime = new Date(), targetType = 'verbal', residualCap = 0.3) {
  let active = 0;
  let residual = 0;

  for (const gift of giftList) {
    const giftMeta = giftCatalog[gift.id];
    if (!giftMeta) continue;

    const applies = giftMeta.type === targetType || giftMeta.type === 'both';
    if (!applies) continue;

    const tHours = (currentTime - gift.givenAt) / 3600000;
    const effect = calculateGiftEffect(giftMeta.value, tHours, giftMeta.halfLife);

    if (effect > 0) {
      active += effect;
    } else {
      residual += giftMeta.minContribution || 0;
    }
  }

  return active + Math.min(residual, residualCap);
}
