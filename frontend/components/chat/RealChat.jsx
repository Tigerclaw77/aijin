// /components/Chat/RealChat.jsx
"use client";

import { useEffect, useRef, useState } from "react";
import Avatar from "./Avatar";
import useAuthStore from "../../store/authStore";
import useCompanionStore from "../../store/companionStore";
import useChatLogic from "../../hooks/useChatLogic";
import GiftPanel from "../GiftPanel";
import GiftShopModal from "../GiftShopModal";
import GiftToast from "../GiftToast";

const PLAN_LIMITS = { free: 5, friend: 50 };
const KNOWN_GIFTS = new Set(["tea", "coffee", "boba", "energy_drink"]);

// Let UI send "Energy Drink" / "energy-drink" / etc.
const NAME_TO_ID = {
  tea: "tea",
  "tea drink": "tea",
  coffee: "coffee",
  "iced coffee": "coffee",
  boba: "boba",
  "bubble tea": "boba",
  energydrink: "energy_drink",
  "energy drink": "energy_drink",
  "energy-drink": "energy_drink",
  energy_drink: "energy_drink",
};

function normalizeGiftId(giftLike) {
  const raw = (
    typeof giftLike === "string"
      ? giftLike
      : giftLike?.id || giftLike?.name || giftLike?.giftId || giftLike?.type || ""
  )
    .toString()
    .trim()
    .toLowerCase();

  const spaced = raw.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  const joined = spaced.replace(/\s+/g, "");
  return NAME_TO_ID[spaced] || NAME_TO_ID[joined] || spaced.replace(/\s+/g, "_");
}

export default function RealChat() {
  const { currentCompanion, selectedPersonality, setCurrentCompanion } = useCompanionStore();
  const { user } = useAuthStore();

  const [tokens, setTokens] = useState(null);
  const [activeGift, setActiveGift] = useState(null);
  const [showGifts, setShowGifts] = useState(true);
  const [showGiftShop, setShowGiftShop] = useState(false);
  const scrollAnchorRef = useRef(null);
  const giftPanelRef = useRef(null);

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
    userTier,              // "sample" | "free" | "friend"
    isApplyingGift,
    applyingGiftId,
    questionCount,
    giftUnlocks,
    unlimitedUntil,
    chatContext,
  } = useChatLogic({
    user,
    currentCompanion,
    selectedPersonality,
    setCurrentCompanion,
    setActiveGift,
    setShowGifts,
    giftPanelRef,
  });

  const unlimitedActive =
    giftUnlocks?.bobaActive ||
    (unlimitedUntil && new Date(unlimitedUntil) > new Date());

  const tierCap = PLAN_LIMITS[userTier] ?? PLAN_LIMITS.free;
  const tierCapReached = !unlimitedActive && questionCount >= tierCap;
  const effectiveReachedLimit = reachedLimit || tierCapReached;

  useEffect(() => {
    if (user?.profile?.tokens != null) setTokens(user.profile.tokens);
  }, [user]);

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isTyping]);

  // Crash-proof gift handler with normalization + logging
  const onGiftUsedHandler = (payload) => {
    try {
      const canonicalId = normalizeGiftId(payload);
      if (!canonicalId || !KNOWN_GIFTS.has(canonicalId)) {
        console.warn("Ignoring unknown gift payload:", payload);
        return;
      }
      const n = Number(payload?.newBalance);
      if (Number.isFinite(n)) setTokens(n);

      // Always forward canonical id; keep any extras for server compatibility
      handleGiftUsed?.({
        ...(typeof payload === "object" ? payload : {}),
        id: canonicalId,
        giftId: canonicalId,
        name: {
          tea: "Tea",
          coffee: "Coffee",
          boba: "Boba",
          energy_drink: "Energy Drink",
        }[canonicalId] || canonicalId,
      });

      setActiveGift(canonicalId);
    } catch (err) {
      // This gives you an app-owned stack instead of devtools noise
      console.error("onGiftUsedHandler error. Raw payload →", payload, "\nError:", err);
    }
  };

  const renderText = (msg) => {
    let value = msg?.text;
    let depth = 0;
    while (typeof value === "object" && value !== null && depth < 3) {
      value = value.text ?? value.content ?? null;
      depth++;
    }
    if (value === "__MESSAGE_LIMIT_REACHED__") {
      return (
        <span>
          💬 You’ve reached your message limit{" "}
          <a href="/subscribe" className="underline text-blue-500 hover:text-blue-700">
            Upgrade to continue
          </a>
          .
        </span>
      );
    }
    if (typeof value === "string") return value;
    return "[Error: Invalid message content]";
  };

  return (
    <div className="flex flex-col bg-gray-800 p-4 mt-10 rounded-xl shadow-xl max-w-2xl mx-auto min-h-[700px]">
      {/* Chat window */}
      <div className="flex-1 overflow-y-auto space-y-2 border border-white/10 rounded-lg p-2 bg-gray-900/40 min-h-[500px] max-h-[500px]">
        {messages.map((msg, idx) => (
          <div
            key={msg.id || idx}
            className={`flex items-start mb-3 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.sender === "ai" && (
              <Avatar
                src={currentCompanion?.avatar_image_url}
                letter={currentCompanion?.name?.[0] || "R"}
              />
            )}
            <div
              className={`max-w-xs px-4 py-2 rounded-lg text-sm shadow-sm ${
                msg.sender === "user"
                  ? "bg-blue-500 text-white rounded-br-none"
                  : "bg-white text-gray-800 rounded-bl-none"
              }`}
            >
              {renderText(msg)}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-start my-2">
            <Avatar
              src={currentCompanion?.avatar_image_url}
              letter={currentCompanion?.name?.[0] || "R"}
            />
            <div className="max-w-xs px-4 py-2 rounded-lg text-sm shadow-sm bg-white text-gray-500 italic animate-pulse">
              typing...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
        <div ref={scrollAnchorRef} className="h-1" />
      </div>

      {/* Gifts toggle */}
      <div className="flex justify-end mt-3">
        <button
          onClick={() => setShowGifts((prev) => !prev)}
          className="text-sm font-semibold tracking-wide text-pink-400 hover:text-pink-200 transition-all duration-300"
        >
          {showGifts ? "Hide Gifts" : "Show Gifts"}
        </button>
      </div>

      {/* Gifts panel */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          showGifts ? "max-h-[500px] opacity-100 mt-2" : "max-h-0 opacity-0"
        }`}
      >
        <div ref={giftPanelRef}>
          <GiftPanel
            onGiftUsed={onGiftUsedHandler}
            tier={userTier}
            onGiftShop={() => setShowGifts(true)}
            disabled={false}
            isApplyingGift={isApplyingGift}
            applyingGiftId={applyingGiftId}
          />
        </div>
      </div>

      {showGiftShop && <GiftShopModal onClose={() => setShowGiftShop(false)} />}

      {/* Composer */}
      <div className="flex mt-4 gap-2">
        <input
          type="text"
          className={`flex-1 rounded-lg border px-4 py-2 text-sm shadow-sm ${
            (inputDisabled || isLoading || effectiveReachedLimit) ? "opacity-60 cursor-not-allowed" : ""
          }`}
          placeholder={
            effectiveReachedLimit
              ? userTier === "free"
                ? "Free limit reached — send a gift or subscribe 💝"
                : "Limit reached — send a gift to keep going 💝"
              : "Ask me anything..."
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !effectiveReachedLimit && sendMessage()}
          disabled={inputDisabled || isLoading || effectiveReachedLimit}
        />
        <button
          onClick={sendMessage}
          className={`px-4 py-2 rounded-lg shadow ${
            inputDisabled || isLoading || effectiveReachedLimit
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
          disabled={inputDisabled || isLoading || effectiveReachedLimit}
        >
          {isLoading ? "..." : "Send"}
        </button>
      </div>

      {/* Toast */}
      {activeGift && (
        <GiftToast
          giftName={activeGift}
          userTokens={tokens ?? user?.profile?.tokens ?? 0}
          onClose={() => setActiveGift(null)}
          onBuyMore={() => (window.location.href = "/tokens")}
        />
      )}
    </div>
  );
}
