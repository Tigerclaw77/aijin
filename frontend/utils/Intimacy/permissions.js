/**
 * Rank-gated thresholds.
 * Photos: removed "alluring". Shifted so:
 *  - bikini @ 3, topless @ 4 (girlfriend), full nude @ 5 (waifu).
 */
export const THRESHOLDS = {
  photos: {
    basic:   1,
    bikini:  3,
    topless: 4, // girlfriend
    nude:    5, // waifu
  },
  chat: {
    flirty:   2,
    romantic: 3,
    spicy:    4,
    explicit: 5,
  },
  gifts: {
    premiumDrinks: 2,
    wardrobe:      3,
    lingerie:      4,
    privateSet:    5,
  },
};

export function permissionsForRank(rank) {
  const r = Math.max(1, Math.min(5, Number(rank) || 1));
  return {
    photos: {
      basic:   r >= THRESHOLDS.photos.basic,
      bikini:  r >= THRESHOLDS.photos.bikini,
      topless: r >= THRESHOLDS.photos.topless,
      nude:    r >= THRESHOLDS.photos.nude,
    },
    chat: {
      flirty:   r >= THRESHOLDS.chat.flirty,
      romantic: r >= THRESHOLDS.chat.romantic,
      spicy:    r >= THRESHOLDS.chat.spicy,
      explicit: r >= THRESHOLDS.chat.explicit,
    },
    gifts: {
      premiumDrinks: r >= THRESHOLDS.gifts.premiumDrinks,
      wardrobe:      r >= THRESHOLDS.gifts.wardrobe,
      lingerie:      r >= THRESHOLDS.gifts.lingerie,
      privateSet:    r >= THRESHOLDS.gifts.privateSet,
    },
  };
}
