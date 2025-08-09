export function getMoodGreeting(emotion) {
  switch (emotion) {
    case "longing":
      return "She seems quieter today... as if she misses you.";
    case "love":
      return "She’s glowing with affection.";
    case "sad":
      return "Her voice softens, sensing something’s off.";
    case "angry":
      return "There’s a sharpness to her words you’ve not felt in a while.";
    case "happy":
      return "Her mood is light — full of playful energy.";
    default:
      return "";
  }
}
