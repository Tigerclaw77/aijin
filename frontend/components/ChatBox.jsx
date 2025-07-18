"use client";
import { useState, useRef, useEffect } from "react";

const initialMessages = [
  { id: 1, text: "Hi there, how was your day?", sender: "ai" },
  { id: 2, text: "Pretty good! Just got home.", sender: "user" },
  { id: 3, text: "Glad to hear it. Want to unwind together?", sender: "ai" },
];

export default function ChatBox() {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  const sendMessage = () => {
    if (!input.trim()) return;
    const newMessage = {
      id: Date.now(),
      text: input,
      sender: "user",
    };
    setMessages([...messages, newMessage]);
    setInput("");

    // TODO: replace this with real AI + backend call
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        newMessage,
        {
          id: Date.now() + 1,
          text: "Tell me more 💭",
          sender: "ai",
        },
      ]);
    }, 500);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-gray-100 p-4">
      <div className="flex-1 overflow-y-auto space-y-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-lg text-sm shadow-sm ${
                msg.sender === "user"
                  ? "bg-blue-500 text-white rounded-br-none"
                  : "bg-white text-gray-800 rounded-bl-none"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex mt-4 gap-2">
        <input
          type="text"
          className="flex-1 rounded-lg border px-4 py-2 text-sm shadow-sm"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-600"
        >
          Send
        </button>
      </div>
    </div>
  );
}
