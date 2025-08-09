/**
 * Returns a string describing the user's recent interests or hobbies.
 * @param {Array} history - List of recent memory messages (text field required)
 * @returns {string}
 */
export function getInterestContext(history = []) {
  const interestKeywords = {
    basketball: "User seems interested in basketball.",
    gaming: "User has mentioned gaming recently.",
    cooking: "User appears to enjoy cooking.",
    travel: "User mentioned travel or trips.",
    music: "User is into music or shared song references.",
    gym: "User goes to the gym or works out.",
    anime: "User watches anime.",
    study: "User is busy with school or studying.",
    writing: "User mentioned writing or journaling.",
    hiking: "User enjoys hiking or nature.",
    photography: "User brought up taking photos or photography.",
    fashion: "User seems interested in fashion or style.",
    programming: "User does coding or tech projects.",
  };

  const lowerHistory = history.map((m) => m.text?.toLowerCase() || "");
  const matched = Object.entries(interestKeywords).filter(([keyword]) =>
    lowerHistory.some((text) => text.includes(keyword))
  );

  if (!matched.length) return "No strong interests recently detected.";

  const lines = matched.map(([, line]) => `- ${line}`);
  return lines.join("\n");
}
