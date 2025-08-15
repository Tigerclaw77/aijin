"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Avatar from "./Avatar";

const AVATAR_URL = "/avatars/rika.png"; // put file in frontend/public/avatars/rika.png

async function generatePreviewReply(userText, turn) {
  const res = await fetch("/api/preview-reply", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userText, turn }),
  });
  if (!res.ok) {
    const { error } = await res.json().catch(() => ({}));
    throw new Error(error || "Failed to generate reply");
  }
  const data = await res.json();
  return (data?.text || "").trim();
}

export default function PreviewChat() {
  // message shape: { id, sender: "ai" | "user", text: string, type?: "cta", href?: string }
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "ai",
      text: "Hi! I’m Rika. This is a quick preview — say hi and try a couple of messages 💬",
    },
  ]);
  const [input, setInput] = useState("");
  const [userTurns, setUserTurns] = useState(0); // max 3
  const [isTyping, setIsTyping] = useState(false);
  const [lastError, setLastError] = useState("");
  const endRef = useRef(null);
  const idRef = useRef(2);

  const maxPreview = 3;
  const reachedLimit = userTurns >= maxPreview;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isTyping]);

  const nextId = () => idRef.current++;

  const send = async () => {
    const text = input.trim();
    if (!text || reachedLimit) return;

    const nextTurn = userTurns + 1;

    // push user message (data only)
    setMessages((m) => [...m, { id: nextId(), sender: "user", text }]);
    setInput("");
    setUserTurns(nextTurn);
    setIsTyping(true);
    setLastError("");

    try {
      const aiText = await generatePreviewReply(text, nextTurn);

      const aiMsg = { id: nextId(), sender: "ai", text: aiText };

      if (nextTurn === 3) {
        const ctaMsg = {
          id: nextId(),
          sender: "ai",
          type: "cta",
          text: "Ready for the real thing? Create your account and I’ll introduce you — my friends are waiting. 💘",
          href: "/register",
        };
        setMessages((m) => [...m, aiMsg, ctaMsg]);
      } else {
        setMessages((m) => [...m, aiMsg]);
      }
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          id: nextId(),
          sender: "ai",
          text: "Hmm, I’m having trouble sending that reply right now.",
        },
        {
          id: nextId(),
          sender: "ai",
          type: "cta",
          text: "Want the full experience? Register and I’ll set up a proper chat.",
          href: "/register",
        },
      ]);
      setLastError(err?.message || "Failed to generate");
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col bg-gray-800 p-4 mt-10 rounded-xl shadow-xl max-w-2xl mx-auto min-h-[700px]">
      <div className="mb-2 text-right text-sm text-gray-300">
        <span className="font-semibold">Preview</span>: Rika (3 messages)
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 border border-white/10 rounded-lg p-2 bg-gray-900/40 min-h-[500px] max-h-[500px]">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start mb-3 ${
              msg.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.sender === "ai" && <Avatar src={AVATAR_URL} letter="R" />}

            <div
              className={`max-w-xs px-4 py-2 rounded-lg text-sm shadow-sm ${
                msg.sender === "user"
                  ? "bg-blue-500 text-white rounded-br-none"
                  : "bg-white text-gray-800 rounded-bl-none"
              }`}
            >
              {msg.type === "cta" ? (
                <span>
                  {msg.text.replace("Create your account", "").trim()}{" "}
                  <Link
                    href={msg.href || "/register"}
                    className="underline text-pink-600 hover:text-pink-700"
                  >
                    Create your account
                  </Link>
                  {" "}and I’ll introduce you — my friends are waiting. 💘
                </span>
              ) : (
                msg.text
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-start my-2">
            <Avatar src={AVATAR_URL} letter="R" />
            <div className="max-w-xs px-4 py-2 rounded-lg text-sm shadow-sm bg-white text-gray-500 italic animate-pulse">
              typing...
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Bottom CTA bar as backup, and to show errors unobtrusively */}
      <div className="mt-3 rounded-lg border border-white/10 bg-gray-900/60 p-3 flex items-center justify-between">
        <div className="text-sm text-gray-200">
          You’re in preview. Enjoy three free messages.
          {lastError ? <span className="ml-2 text-red-300">({lastError})</span> : null}
        </div>
        <Link
          href="/register"
          className="px-3 py-1.5 rounded-md bg-pink-600 text-white text-sm font-semibold hover:bg-pink-700"
        >
          Register
        </Link>
      </div>

      <div className="flex mt-4 gap-2">
        <input
          type="text"
          className={`flex-1 rounded-lg border px-4 py-2 text-sm shadow-sm ${
            reachedLimit ? "opacity-60 cursor-not-allowed" : ""
          }`}
          placeholder={
            reachedLimit
              ? "Preview limit reached — Register to keep chatting 💝"
              : "Say hi to Rika…"
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          disabled={reachedLimit}
        />
        <button
          onClick={send}
          className={`px-4 py-2 rounded-lg shadow ${
            reachedLimit
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
          disabled={reachedLimit}
        >
          Send
        </button>
      </div>
    </div>
  );
}
