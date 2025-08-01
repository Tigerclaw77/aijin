"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "../store/authStore";
import useCompanionStore from "../store/companionStore";
import useChatLogic from "../hooks/useChatLogic";
import GiftPanel from "./GiftPanel";
import GiftShopModal from "./GiftShopModal";
import GiftToast from "./GiftToast";

export default function ChatBox() {
  const {
    currentCompanion,
    selectedPersonality,
    setCurrentCompanion,
  } = useCompanionStore();

  const { user } = useAuthStore();
  const [activeGift, setActiveGift] = useState(null);
  const [showGifts, setShowGifts] = useState(true);
  const [showGiftShop, setShowGiftShop] = useState(false);
  const scrollAnchorRef = useRef(null);
  const router = useRouter();

  const tier = useMemo(() => {
    const t = user?.profile?.subscription_tier?.toLowerCase();
    if (!t) return "free";
    if (["friend", "crush", "girlfriend", "waifu", "harem"].includes(t)) {
      return t === "friend" ? "friend" : "premium";
    }
    return "free";
  }, [user]);

  const {
    messages,
    input,
    setInput,
    sendMessage,
    isTyping,
    isLoading,
    reachedLimit,
    inputDisabled,
    messagesEndRef,
    memoryEnabled,
    companionName,
    handleGiftUsed,
    userTier,
    questionCount,
    bonusMessages,
    giftUnlocks,
    unlimitedUntil,
    cacheKeyRef,
    fetchedCompanion,
  } = useChatLogic({
    user,
    currentCompanion,
    selectedPersonality,
    setCurrentCompanion,
    setActiveGift,
  });

  // ✅ Update only if companion ID changes
  useEffect(() => {
    if (
      fetchedCompanion?.companion_id &&
      fetchedCompanion?.companion_id !== currentCompanion?.companion_id
    ) {
      setCurrentCompanion(fetchedCompanion);
    }
  }, [fetchedCompanion, currentCompanion, setCurrentCompanion]);

  useEffect(() => {
    if (scrollAnchorRef.current) {
      scrollAnchorRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [messages, isTyping]);

  if (!user || !companionName || memoryEnabled === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-400 animate-pulse">
        <div className="text-3xl">✨ Getting ready...</div>
        <div className="text-sm mt-2">Warming up your companion</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-gray-800 p-4 mt-10 rounded-xl shadow-xl max-w-2xl mx-auto min-h-[700px]">
      <div className="flex-1 overflow-y-auto space-y-2 border border-white/10 rounded-lg p-2 bg-gray-900/40 min-h-[500px] max-h-[500px]">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start mb-3 ${
              msg.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.sender === "ai" && currentCompanion?.avatar_image_url && (
              <div className="w-8 h-8 mr-2 rounded-full overflow-hidden border border-pink-500 shadow-sm">
                <img
                  src={currentCompanion.avatar_image_url}
                  alt="AI"
                  className="w-full h-full object-cover transition-opacity duration-300 opacity-0"
                  style={{
                    objectPosition: "center -20%",
                    transform: "scale(1.3)",
                  }}
                  onLoad={(e) => e.currentTarget.classList.remove("opacity-0")}
                />
              </div>
            )}
            <div
              className={`max-w-xs px-4 py-2 rounded-lg text-sm shadow-sm ${
                msg.sender === "user"
                  ? "bg-blue-500 text-white rounded-br-none"
                  : "bg-white text-gray-800 rounded-bl-none"
              }`}
            >
              {msg.text === "__MESSAGE_LIMIT_REACHED__" ? (
                <span>
                  💬 You've reached your message limit.{" "}
                  <a
                    href="/subscribe"
                    className="underline text-blue-500 hover:text-blue-700"
                  >
                    Upgrade to continue
                  </a>
                  .
                </span>
              ) : (
                msg.text
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-start my-2">
            <div className="w-8 h-8 mr-2 rounded-full overflow-hidden border border-pink-500 shadow-sm">
              <img
                src={currentCompanion?.avatar_image_url}
                alt="AI"
                className="w-full h-full object-cover transition-opacity duration-300 opacity-0"
                style={{
                  objectPosition: "center -20%",
                  transform: "scale(1.3)",
                }}
                onLoad={(e) => e.currentTarget.classList.remove("opacity-0")}
              />
            </div>
            <div className="max-w-xs px-4 py-2 rounded-lg text-sm shadow-sm bg-white text-gray-500 italic animate-pulse">
              typing...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
        <div ref={scrollAnchorRef} className="h-1" />
      </div>

      <div className="flex justify-end mt-3">
        <button
          onClick={() => setShowGifts((prev) => !prev)}
          className="text-sm font-semibold tracking-wide text-pink-400 hover:text-pink-200 transition-all duration-300"
        >
          {showGifts ? "🙈 Hide Gifts" : "🎁 Show Gifts"}
        </button>
      </div>

      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          showGifts ? "max-h-[500px] opacity-100 mt-2" : "max-h-0 opacity-0"
        }`}
      >
        <GiftPanel
          onGiftUsed={handleGiftUsed}
          tier={tier}
          onGiftShop={() => setShowGiftShop(true)}
        />
      </div>

      {showGiftShop && <GiftShopModal onClose={() => setShowGiftShop(false)} />}

      <div className="flex mt-4 gap-2">
        <input
          type="text"
          className="flex-1 rounded-lg border px-4 py-2 text-sm shadow-sm"
          placeholder={
            inputDisabled || reachedLimit
              ? "Message limit reached"
              : "Ask me anything..."
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          disabled={inputDisabled || isLoading || reachedLimit}
        />
        <button
          onClick={sendMessage}
          className={`px-4 py-2 rounded-lg shadow ${
            inputDisabled || isLoading || reachedLimit
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
          disabled={inputDisabled || isLoading || reachedLimit}
        >
          {isLoading ? "..." : "Send"}
        </button>
      </div>

      {/* ✅ Show debug info only in dev */}
      {process.env.NODE_ENV === "development" && (
        <div className="mt-4 p-3 rounded-md bg-black/30 text-xs text-gray-300 border border-white/10 shadow-inner">
          <p>
            <strong>Debug Info</strong>
          </p>
          <p>Tier: {userTier}</p>
          <p>Messages Sent: {questionCount}</p>
          <p>Bonus Messages: {bonusMessages}</p>
          <p>
            Boba Unlimited Active:{" "}
            {giftUnlocks?.bobaActive === undefined
              ? "—"
              : giftUnlocks.bobaActive
              ? "Yes"
              : "No"}
          </p>
          <p>Unlimited Until: {unlimitedUntil?.toLocaleString() || "—"}</p>
          <p>Reached Limit: {reachedLimit ? "Yes" : "No"}</p>
          <p>
            Memory Enabled:{" "}
            {memoryEnabled === null
              ? "Checking..."
              : memoryEnabled
              ? "Yes"
              : "No"}
          </p>
          <p>Companion ID: {currentCompanion?.companion_id || "None"}</p>
          <p>Cache Key: {cacheKeyRef.current}</p>
        </div>
      )}

      {activeGift && (
        <GiftToast
          giftName={activeGift}
          userTokens={user?.profile?.tokens || 0}
          onClose={() => setActiveGift(null)}
          onBuyMore={() => router.push("/tokens")}
        />
      )}
    </div>
  );
}
