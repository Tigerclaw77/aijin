export function getGiftUnlocks(profile) {
  const unlocks = {
    tea: profile?.unlocks_tea || 0,
    coffee: profile?.unlocks_coffee || 0,
    boba: profile?.unlocks_boba || 0,
  };
  const bobaTimestamp = new Date(profile?.unlocked_boba_at || 0);
  const bobaActive = Date.now() - bobaTimestamp.getTime() < 24 * 60 * 60 * 1000;
  return {
    ...unlocks,
    bobaActive,
  };
}

export function getGiftEmotionLine(emotion) {
  return {
    cozy: "Mmm... you always know how to warm my heart. 🍵",
    alert: "You’re trying to keep me up late, aren’t you? ☕",
    joy: "Boba?! You angel!! 🧋💕",
    excited: "Let’s GO. I’m feeling hyped! 🥤",
  }[emotion];
}
