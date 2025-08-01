// utils/chatUtils.js
export function getUserTier(profile) {
  if (!profile) return "sample";
  const tier = profile.subscription_tier?.toLowerCase();
  if (["friend", "crush", "girlfriend", "waifu", "harem"].includes(tier)) {
    return tier === "friend" ? "friend" : "premium";
  }
  return "free";
}

export function getGiftUnlocks(profile) {
  const unlocks = {
    tea: profile?.unlocks_tea || 0,
    coffee: profile?.unlocks_coffee || 0,
    boba: profile?.unlocks_boba || 0,
  };
  const bobaTimestamp = new Date(profile?.unlocked_boba_at || 0);
  const bobaActive = Date.now() - bobaTimestamp.getTime() < 24 * 60 * 60 * 1000;
  return { ...unlocks, bobaActive };
}
