function getRelationshipRank(xp) {
  if (xp >= 400) return "Soulmate";
  if (xp >= 300) return "Lover";
  if (xp >= 200) return "Girlfriend";
  if (xp >= 100) return "Crush";
  return "New Match";
}

export function getRelationshipContext(xp = 0, lastSeen = null, chatHistory = []) {
  const rank = getRelationshipRank(xp);
  const lastMessage = chatHistory?.at(-1)?.text;
  return `Rank: ${rank}${lastSeen ? `\nLast seen: ${new Date(lastSeen).toLocaleString()}` : ""}${lastMessage ? `\nLast message: “${lastMessage}”` : ""}`;
}