// hooks/useGreetingMessage.js
import { useEffect } from "react";

export default function useGreetingMessage({
  messages,
  personality,
  companionName,
  matchedArchetype,
  memoryEnabled,
  setMessages,
}) {
  useEffect(() => {
    if (
      messages.length > 0 ||
      !personality ||
      !companionName ||
      memoryEnabled === null
    )
      return;

    const nickname = matchedArchetype?.nickname
      ? ` — ${matchedArchetype.nickname.toLowerCase()}`
      : "";

    const memoryNote = !memoryEnabled
      ? "This is just a preview, so I won’t remember anything… unless you stick around. 💫"
      : "I remember everything we’ve shared… 💖";

    const greeting = `Hi, I’m ${companionName}${nickname}. Ask me anything. ${memoryNote}`;

    setMessages([{ id: Date.now(), text: greeting, sender: "ai" }]);
  }, [messages, personality, companionName, matchedArchetype, memoryEnabled]);
}
