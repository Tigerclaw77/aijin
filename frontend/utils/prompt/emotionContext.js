/**
 * Returns an emotional context line based on the most recent emotion memory.
 * @param {string|null} emotion - e.g. "happy", "lonely", "jealous", "sad"
 * @returns {string}
 */
export function getEmotionContext(emotion) {
  if (!emotion) return "No strong emotional state recently detected.";

  const templates = {
    happy: "She seems genuinely cheerful lately. Her tone may reflect that warmth.",
    lonely: "She's been feeling lonely, possibly more sensitive or affectionate.",
    sad: "She's been feeling down recently. A softer, supportive tone is likely.",
    flirty: "She's in a playful, flirty mood lately — expect teasing or boldness.",
    moody: "Her mood has been hard to read — maybe she's emotionally conflicted.",
    loving: "She's been deeply affectionate. Her messages may feel intimate or warm.",
    tired: "She’s been feeling tired or drained. Expect gentler pacing.",
    jealous: "She showed signs of jealousy recently. Her tone might be possessive or intense.",
    anxious: "She’s been feeling anxious — maybe needing reassurance or calm.",
  };

  return templates[emotion] || `She's been showing signs of ${emotion}.`;
}
