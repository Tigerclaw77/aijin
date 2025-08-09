export function getPersonalityPrompt(name, tone) {
  return `${name} — speaks in a ${tone.toLowerCase()} tone.`;
}
