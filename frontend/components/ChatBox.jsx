"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import Link from "next/link";
import useCompanionStore from "../store/companionStore";
import { intimacyArchetypes } from "../data/intimacy";
import { models } from "../data/models"; // ✅ needed to resolve model_id to name

const fallbackPersonality = {
  id: "fallback",
  name: "Miyu",
  tone: "Sweet & playful",
  memoryLength: "Short (preview only)",
  sampleQuotes: [],
};

export default function ChatBox() {
  const currentCompanion = useCompanionStore((state) => state.currentCompanion);
  const selectedPersonality = useCompanionStore((state) => state.selectedPersonality);

  const [personality, setPersonality] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [questionCount, setQuestionCount] = useState(0);
  const [inputDisabled, setInputDisabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef(null);

  // ✅ Companion name resolution
  const companionName = useMemo(() => {
    if (!currentCompanion) return "Loading...";
    if (currentCompanion.custom_name?.trim()) return currentCompanion.custom_name.trim();

    const model = models.find((m) => m.id === currentCompanion.model_id);
    return model?.name || "Unknown";
  }, [currentCompanion]);

  // 🔍 Debug log
  useEffect(() => {
    console.log("🧠 Debug: currentCompanion =", currentCompanion);
    console.log("🧠 Debug: resolved companionName =", companionName);
  }, [currentCompanion, companionName]);

  const matchedArchetype = useMemo(() => {
    return intimacyArchetypes.find(
      (a) =>
        a.verbal === currentCompanion?.verbal_intimacy &&
        a.sexual === currentCompanion?.sexual_intimacy
    );
  }, [currentCompanion]);

  useEffect(() => {
    setPersonality(selectedPersonality || fallbackPersonality);
  }, [selectedPersonality]);

  useEffect(() => {
    if (!personality || !companionName) return;

    const greeting = `Hi, I’m ${companionName}${
      matchedArchetype?.nickname ? ` — ${matchedArchetype.nickname.toLowerCase()}` : ""
    }. Ask me anything. This is just a preview, so I won’t remember anything… unless you stick around. 💫`;

    setMessages([
      {
        id: Date.now(),
        text: greeting,
        sender: "ai",
      },
    ]);
  }, [personality, companionName, matchedArchetype]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const displayInitials = useMemo(() => {
    if (!companionName) return "AI";
    return companionName
      .split(" ")
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase())
      .join("")
      .slice(0, 2);
  }, [companionName]);

  const sendMessage = async () => {
    if (!input.trim() || inputDisabled || !personality) return;

    const userMessage = {
      id: Date.now(),
      text: input.trim(),
      sender: "user",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setIsTyping(true);

    try {
      const res = await fetch("/api/chat-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.text,
          personalityName: personality.name,
          tone: personality.tone,
          customName: companionName,
        }),
      });

      const data = await res.json();
      const replyText = data.reply || "Let's keep chatting!";

      const wordsPerSecond = 2;
      const readingDelay = Math.max(10000, userMessage.text.trim().length * 100);
      const typingDelay = replyText.split(" ").length * (1000 / wordsPerSecond);

      setTimeout(() => {
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now() + 1,
              text: replyText,
              sender: "ai",
            },
          ]);

          setIsTyping(false);

          if (questionCount + 1 >= 3) {
            setTimeout(() => {
              setMessages((prev) => [
                ...prev,
                {
                  id: Date.now() + 2,
                  sender: "ai",
                  text: "__SUBSCRIPTION_NOTICE__", // special marker to render link
                },
              ]);
              setInputDisabled(true);
            }, 1000);
          }

          setQuestionCount((prev) => prev + 1);
          setIsLoading(false);
        }, typingDelay);
      }, readingDelay);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 3,
          sender: "ai",
          text: "⚠️ Sorry, I’m having trouble responding right now. Please try again later.",
        },
      ]);
      setIsTyping(false);
      setIsLoading(false);
    }
  };

  if (!currentCompanion || !selectedPersonality) {
    console.log("🔄 Waiting for companion or personality...");
    return (
      <div className="p-4 text-center text-gray-400">Loading your companion...</div>
    );
  }

  return (
    <div className="flex flex-col bg-gray-800 p-4 mt-10 rounded-xl shadow-xl max-w-2xl mx-auto min-h-[700px]">
      <div className="flex-1 overflow-y-auto space-y-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-lg text-sm shadow-sm ${
                msg.sender === "user"
                  ? "bg-blue-500 text-white rounded-br-none"
                  : "bg-white text-gray-800 rounded-bl-none"
              }`}
            >
              {msg.text === "__SUBSCRIPTION_NOTICE__" ? (
                <span>
                  💌 That was your final free message. In the real chat, I’d remember everything about you…{" "}
                  <Link href="/subscribe" className="underline text-blue-500 hover:text-blue-700">
                    Ready to meet the real me?
                  </Link>
                </span>
              ) : (
                msg.text
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="max-w-xs px-4 py-2 rounded-lg text-sm shadow-sm bg-white text-gray-500 italic animate-pulse">
              typing...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex mt-4 gap-2">
        <div className="w-10 h-10 rounded-full bg-gray-500 flex items-center justify-center text-white text-lg font-bold">
          {displayInitials}
        </div>
        <input
          type="text"
          className="flex-1 rounded-lg border px-4 py-2 text-sm shadow-sm"
          placeholder={inputDisabled ? "Preview limit reached" : "Ask me anything..."}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          disabled={inputDisabled || isLoading}
        />
        <button
          onClick={sendMessage}
          className={`px-4 py-2 rounded-lg shadow ${
            inputDisabled || isLoading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
          disabled={inputDisabled || isLoading}
        >
          {isLoading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}
