import { useEffect, useRef, useState } from "react";
import personalities from "../data/personalities";

export default function SampleChatModal({ isOpen, onClose, personalityId, avatarName }) {
  const personality = personalities.find(p => p.id === personalityId);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [exchangeCount, setExchangeCount] = useState(0);
  const [expired, setExpired] = useState(false);
  const timerRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !personality) return;

    // Reset state when modal opens
    setMessages([ 
      { from: "ai", text: getSampleDialogue(personalityId, 0) },
      { from: "user", text: getSampleDialogue(personalityId, 1) },
      { from: "ai", text: getSampleDialogue(personalityId, 2) }
    ]);
    setInput("");
    setExchangeCount(0);
    setExpired(false);

    // Set 3-min timeout
    timerRef.current = setTimeout(() => setExpired(true), 3 * 60 * 1000);

    return () => clearTimeout(timerRef.current);
  }, [isOpen, personalityId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || expired || exchangeCount >= 3) return;
    const newMessages = [
      ...messages,
      { from: "user", text: input.trim() },
      { from: "ai", text: getAiReply(personality, input.trim()) }
    ];
    setMessages(newMessages);
    setInput("");
    setExchangeCount(exchangeCount + 1);
  };

  if (!isOpen || !personality) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-md rounded-lg shadow-lg p-4 flex flex-col">
        <div className="flex justify-between items-center border-b pb-2 mb-2">
          <h2 className="text-lg font-semibold">
            Preview Chat – {personality.name} ({avatarName})
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 mb-3 px-1">
          {messages.map((msg, i) => (
            <div key={i} className={`text-sm p-2 rounded max-w-[80%] ${msg.from === "ai" ? "bg-blue-100 self-start" : "bg-gray-200 self-end ml-auto"}`}>
              {msg.text}
            </div>
          ))}
          <div ref={scrollRef} />
        </div>

        {expired || exchangeCount >= 3 ? (
          <button
            onClick={onClose}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Save to Favorites / Subscribe
          </button>
        ) : (
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className="flex-1 border px-3 py-2 rounded text-sm"
              placeholder="Say something..."
            />
            <button
              onClick={handleSend}
              className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600"
            >
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Replace with real character-LLM logic later
function getSampleDialogue(personalityId, index) {
  const samples = {
    infp: ["Good morning, my love.", "Hi... I missed you.", "I kept thinking about you today."],
    intj: ["Good morning. I already planned our evening.", "I admire your efficiency.", "You're the constant in my equation."],
    entp: ["Hey sunshine! Ready for some chaos? 😏", "Oh really? Try me.", "Let’s break some rules today."],
    infj: ["Good morning... I dreamt of your smile.", "How do you feel today?", "Talk to me, I'm listening."],
    isfj: ["Did you sleep well?", "I’m always here for you.", "I just want to keep you safe."],
    entj: ["Time to conquer the day. You in?", "You're my top priority.", "We move together."],
    enfp: ["Morning! Dreamt about you!", "You're my favorite distraction.", "Let's make today unforgettable."],
    istj: ["You woke up on time, right?", "Routine is peace.", "I set a reminder just for us."],
    istp: ["Sup. Ready to roll?", "You’re chill. I like that.", "Let’s keep it low key."],
    isfp: ["Mornin’. Painted you in my head.", "You’re my inspiration.", "Wanna vibe together today?"],
    esfj: ["Good morning, sweetie!", "Don’t forget to eat.", "You matter to me."],
    esfp: ["Rise and shine, babe!", "I wanna dance with you.", "Let’s light up today."],
    estp: ["Yo. Let’s do something wild.", "You down? Always are.", "Catch me if you can."],
    estj: ["You're late. Kidding... kinda.", "I like results.", "Let’s crush it today."],
    enfj: ["You ready to shine?", "You inspire me.", "We’ve got this — together."],
    intp: ["Hey. Been thinking... about us.", "You get me like no one else.", "I’m curious what you’ll say next."]
  };
  return samples[personalityId]?.[index % 3] || "Hi there.";
}

function getAiReply(personality, userText) {
  const naughty = /(naked|sex|dirty|send pic|horny|turn on|fuck|boobs|cock)/i;
  if (naughty.test(userText)) {
    switch (personality.tone.toLowerCase()) {
      case "empathetic": return "I... I'm not that kind of girl...";
      case "playful": return "Buy me a drink and we can talk~";
      case "assertive": return "Don't push your luck.";
      case "idealistic": return "That’s not really how I connect...";
      default: return "Don't you think it’s a bit early for that?";
    }
  }
  return `${personality.name.split(" ")[1]}: I like where this is going...`;
}
