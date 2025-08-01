export const tierCaps = {
  sample: 3,
  free: 5,
  friend: 50,
  premium: Infinity,
};

export function getUserTier(profile) {
  if (!profile) return "sample";
  const tier = profile.subscription_tier?.toLowerCase();
  if (["friend", "crush", "girlfriend", "waifu", "harem"].includes(tier)) {
    return tier === "friend" ? "friend" : "premium";
  }
  return "free";
}
