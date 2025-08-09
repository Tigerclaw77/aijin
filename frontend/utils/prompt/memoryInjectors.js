export async function injectTopMemories(facts = []) {
  if (!facts.length) return "- (no strong memories yet)";
  return facts
    .slice(0, 10)
    .map((m) => `- ${m.content}`)
    .join("\n");
}