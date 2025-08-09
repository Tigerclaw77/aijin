// /hooks/useGreetingMessage.js
import { useEffect } from "react";
import { verbalGreetingStyles } from "../data/mbtiGreetings"; // <-- correct path

function getGreetingFromMBTI(personality, verbalLevel) {
  if (!personality?.mbti || !verbalLevel) {
    console.log("⚠️ Missing MBTI or verbalLevel", { mbti: personality?.mbti, verbalLevel });
    return null;
  }

  const mbti = personality.mbti.toUpperCase(); // e.g. ENFP
  const ie = mbti[0]; // E or I
  const tf = mbti[2]; // T or F
  const key = `${ie}${tf}`; // e.g. EF

  console.log("🔍 Looking for MBTI key:", key);
  console.log("🔍 Verbal level:", verbalLevel);

  const match = verbalGreetingStyles.find(
    (entry) =>
      entry.personality === key &&
      entry.verbal === verbalLevel
  );

  console.log("✅ Greeting match found:", match);

  return match?.introQuote || null;
}

/**
 * Sets the initial greeting message when chat begins.
 * Integrates MBTI-based personality greeting and memory mode.
 */
export default function useGreetingMessage({
  messages,
  personality,
  companionName,
  matchedArchetype,
  memoryEnabled,
  setMessages,
  restored = false,
}) {
  useEffect(() => {
    if (
      restored ||
      messages.length > 0 ||
      !personality ||
      !companionName ||
      memoryEnabled === null
    )
      return;

    const nickname = matchedArchetype?.nickname
      ? ` — ${matchedArchetype.nickname.toLowerCase()}`
      : "";

    const verbalLevel = Math.max(1, matchedArchetype?.verbal || 1);

    console.log("🧠 Greeting logic starting");
    console.log("📦 Personality:", personality?.mbti);
    console.log("🎭 Nickname:", nickname);
    console.log("🔢 Verbal Level:", verbalLevel);

    const intro =
      getGreetingFromMBTI(personality, verbalLevel) ||
      personality.sampleGreeting ||
      `Hi, I'm ${companionName}${nickname}.`;

    const memoryNote = !memoryEnabled
      ? "This is just a preview, so I might forget what we say... unless you stick around. 💫"
      : "I remember everything we’ve shared… 💖";

    const fullGreeting = `${intro}\n${memoryNote}`;

    console.log("💬 Final Greeting:", fullGreeting);

    setMessages([{ id: Date.now(), text: fullGreeting, sender: "ai" }]);
  }, [
    messages,
    personality,
    companionName,
    matchedArchetype,
    memoryEnabled,
    setMessages,
    restored,
  ]);
}
