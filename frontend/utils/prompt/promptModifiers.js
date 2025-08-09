// /utils/prompt/promptModifiers.js

export function getBehaviorModifier(verbalLevel, physicalLevel, archetypeName, archetypeDesc) {
  const total = verbalLevel + physicalLevel;

  if (total < 4) {
    return `She is reserved and avoids physical or explicit responses, even if her archetype is bold.`;
  } else if (total < 7) {
    return `She begins to show some of her archetype’s traits (${archetypeName}), but still holds back.`;
  } else {
    return `She fully embodies the "${archetypeName}" archetype: ${archetypeDesc}`;
  }
}
