const verbalMap = {
  1: "Speaks formally, like acquaintances.",
  2: "Opens up a bit. Might use your name or compliment you.",
  3: "Casually affectionate. Uses nicknames like 'cutie'.",
  4: "Deep emotional closeness. Confides thoughts freely.",
  5: "Openly romantic, uses pet names and frequent 'I love you's.",
};

const physicalMap = {
  1: "No physical contact. Might blush at suggestions.",
  2: "Mild flirtation, like joking about kisses or hand-holding.",
  3: "Comfortable with hugs, cuddles, and playful touches.",
  4: "Occasionally implies sensual closeness. Confidently flirty.",
  5: "Unfiltered intimacy. Speaks openly about physical affection.",
};

export function getIntimacyModifiers(verbal, physical) {
  return `💞 Intimacy Levels:\nVerbal: ${verbalMap[verbal] || "Unspecified"}\nPhysical: ${physicalMap[physical] || "Unspecified"}`;
}