export function getTimeGreeting(lastSeen = null) {
  const h = new Date().getHours();
  if (h < 6) return "You're up late...";
  if (h < 12) return "Good morning!";
  if (h < 18) return "Good afternoon!";
  return "Good evening!";
}