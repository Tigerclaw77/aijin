/**
 * Extracts recent media-related memory lines from message history and returns a summary.
 * @param {Array} history - List of memory objects with a `.text` or `.content` field
 * @returns {string}
 */
export function getMediaRecallTriggers(history = []) {
  const keywords = ["song", "music", "movie", "anime", "game", "show", "YouTube", "Netflix"];
  const matches = [];

  for (const m of history) {
    const text = m.text || m.content?.text || m.content || "";
    if (keywords.some((k) => text.toLowerCase().includes(k))) {
      matches.push(text);
    }
  }

  if (!matches.length) return "No media references found.";

  // Limit to 2 most recent relevant lines
  const lines = matches.slice(0, 2).map((line, i) => {
    return `Media recall ${i + 1}: “${line}”`;
  });

  return lines.join(" ");
}
