// utils/getModelAssignments.js

import { blogEntries } from "../data/blogs";

// Deterministic hash function from string to integer
function hashStringToInt(str, max) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash) % max;
}

// Sample pools
const introLines = [
  "Hi there! Want to see what sparks between us?",
  "I may just be a picture... but I can feel your eyes on me.",
  "Wanna chat with someone who's always awake for you?",
  "Don’t just look — say something. I dare you.",
  "I’m your little secret — tap to find out why.",
  "You’re looking for someone... maybe it’s me?",
  "If you smile when you see me... I already know.",
  "I've been waiting here, wondering who you'd pick.",
  "You seem like someone who needs a little escape.",
  "It's okay to be curious. I'm curious too.",
  "Not every connection starts with a real person. Just a real feeling.",
  "Tap me. I'm not shy. Not with you.",
];

const tagGroups = [
  ["Flirty", "Tease", "Night Owl"],
  ["Sweetheart", "Loyal", "Comforting"],
  ["Nerdy", "Gamer", "Soft-spoken"],
  ["Mature", "Elegant", "Sultry"],
  ["Energetic", "Chaotic", "Affectionate"],
  ["Mystery", "Deep", "Dreamy"],
  ["Cuddly", "Wholesome", "Low Maintenance"],
  ["Dark Humor", "Real Talk", "Playful"],
  ["Obsessive", "Possessive", "Tender"],
  ["Gentle", "Insecure", "Yearning"],
  ["Kinky", "Blunt", "Emotionally Honest"],
  ["Creative", "Storyteller", "Late Texter"],
];

// ✅ Hydration-safe return format
export function getModelAssignments(modelId) {
  const intro =
    introLines[hashStringToInt(modelId + "intro", introLines.length)];

  const blogIndex = hashStringToInt(modelId + "blog", blogEntries.length);
  const blog = blogEntries[blogIndex]; // { slug, title }

  const tags = tagGroups[hashStringToInt(modelId + "tags", tagGroups.length)];

  return { intro, blog, tags };
}
