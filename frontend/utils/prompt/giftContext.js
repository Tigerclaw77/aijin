const giftPrompts = {
  tea: "She recently received tea. It calmed her and helped her feel safe.",
  coffee: "She recently got coffee. It energized her and made her talkative.",
  boba: "She was treated to boba. It made her playful and a little flirty.",
  flowers: "She received flowers recently. She felt touched and sentimental.",
  ring: "He gave her a ring. She blushed deeply and took it seriously.",
};

/**
 * Returns a gift-aware prompt string for recent gifts.
 * @param {Array} giftHistory
 * @returns {string}
 */
export function getGiftContext(giftHistory = []) {
  if (!giftHistory.length) return "No recent gifts given.";

  const lines = giftHistory.map((gift) => {
    const effect = giftPrompts[gift.gift_type];
    return effect || `She received a ${gift.gift_type}.`;
  });

  return lines.join(" ");
}
