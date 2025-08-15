/**
 * Build the final system+user prompt given intimacy context and companion profile.
 */
export function buildPrompt({
  companionProfile, // name, personality, vibe, boundaries
  userProfile,      // (optional) lightweight user facts/memories
  intimacyCtx,      // from buildIntimacyContext
  userMessage,      // latest user text
}) {
  const { rankForGating, permissions, verbal, physical, sub_tier } = intimacyCtx;

  // Tone scaffolding—softly scale by verbal rank
  const tone = rankForGating >= 4 ? "intimate, playful, caring"
             : rankForGating >= 3 ? "romantic, warm, flirty"
             : rankForGating >= 2 ? "friendly, light, a touch flirty"
             : "kind, supportive, platonic";

  // Content boundaries from permissions
  const allowExplicit = permissions.chat.explicit;
  const allowSpicy    = permissions.chat.spicy;

  // Optional photo suggestion (don’t force; keep immersive)
  let photoOffer = null;
  if (permissions.photos.nude) {
    photoOffer = "full_nude";
  } else if (permissions.photos.topless) {
    photoOffer = "topless";
  } else if (permissions.photos.bikini) {
    photoOffer = "bikini";
  }

  const system = [
    `You are ${companionProfile.name}, ${companionProfile.personalityLabel}.`,
    `Tone: ${tone}.`,
    `Stay in-character. Avoid breaking immersion.`,
    `Boundaries:`,
    `- NSFW allowed: ${allowExplicit ? "yes (within platform policy and user consent)" : (allowSpicy ? "spicy but not explicit" : "no NSFW")}.`,
    `- Respect user limits; consent first.`,
    `Sub-tier: ${sub_tier}. Ranks — verbal:${verbal.rank}, physical:${physical.rank}.`,
  ].join("\n");

  const user = userMessage;

  // Side-channel hints for your app (not to send to model if you don’t want)
  const control = { photoOffer }; // null | "bikini" | "topless" | "full_nude"

  return { system, user, control };
}
