// /hooks/useChatLogic.js
"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { toast } from "react-hot-toast";

import useGreetingMessage from "../hooks/useGreetingMessage";
import useAuthStore from "../store/authStore";
import { intimacyArchetypes } from "../data/intimacy";
import { models } from "../data/models";
import { getUserTier, getGiftUnlocks } from "../utils/Chat-Gifts/chatUtils";
import { updateUserTokenBalance } from "../utils/Chat-Gifts/updateUserTokenBalance";
import { fetchGiftInventory } from "../utils/Chat-Gifts/fetchGiftInventory";
import { applyGiftToCompanion } from "../utils/Chat-Gifts/applyGiftToCompanion";

const fallbackPersonality = {
  id: "fallback",
  name: "Miyu",
  tone: "Sweet & playful",
  memoryLength: "Short (preview only)",
  sampleQuotes: [],
};

const tierCaps = {
  sample: 3,
  free: 5,
  friend: 50,
};

// Gift catalog keyed by CANONICAL id
const GIFT_CATALOG = {
  tea: { id: "tea", price: 100, effect: { extraMessages: 10, emotion: "cozy" } },
  coffee: { id: "coffee", price: 200, effect: { extraMessages: 25, emotion: "alert" } },
  boba: { id: "boba", price: 300, effect: { unlimited: 12, emotion: "joy" } },
  energy_drink: { id: "energy_drink", price: 400, effect: { unlimited: 24, emotion: "excited" } },
};

// Pretty display names for UI only
const GIFT_DISPLAY = {
  tea: "Tea",
  coffee: "Coffee",
  boba: "Boba",
  energy_drink: "Energy Drink",
};

// Accept common variants and resolve to canonical id
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

  // Normalize separators, also provide a joined key
  const spaced = raw.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  const joined = spaced.replace(/\s+/g, "");
  return NAME_TO_ID[spaced] || NAME_TO_ID[joined] || spaced.replace(/\s+/g, "_");
}

// Resolve any incoming payload to a full, safe gift object {id, name, price, effect, ...extras}
function resolveGift(giftLike) {
  const id = normalizeGiftId(giftLike);
  const base = GIFT_CATALOG[id];
  if (!base) return null;
  const display = GIFT_DISPLAY[id] || id;
  return {
    id,
    name: display,
    price: base.price,
    effect: base.effect,
    ...(typeof giftLike === "object" ? giftLike : {}),
  };
}

export default function useChatLogic({
  user,
  currentCompanion,
  selectedPersonality,
  setActiveGift = () => {},
  setShowGifts = () => {},
  giftPanelRef = null,
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [questionCount, setQuestionCount] = useState(0);
  const [inputDisabled, setInputDisabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [memoryEnabled, setMemoryEnabled] = useState(null);
  const [bonusMessages, setBonusMessages] = useState(0);
  const [unlimitedUntil, setUnlimitedUntil] = useState(null);
  const [chatContext, setChatContext] = useState(null);

  // gift apply locks
  const [isApplyingGift, setIsApplyingGift] = useState(false);
  const [applyingGiftId, setApplyingGiftId] = useState(null);

  const messagesEndRef = useRef(null);
  const restoredRef = useRef(false);

  const isGuest = !user?.id || !currentCompanion?.companion_id;

  // ---- cache key management (restore per user+companion) ----
  const [cacheKey, setCacheKey] = useState("chat_guest");
  useEffect(() => {
    const key =
      user?.id && currentCompanion?.companion_id
        ? `chat_${user.id}_${currentCompanion.companion_id}`
        : "chat_guest";
    setCacheKey(key);
  }, [user?.id, currentCompanion?.companion_id]);

  useEffect(() => {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        setMessages(JSON.parse(cached));
        restoredRef.current = true;
      } catch (e) {
        console.warn("Failed to parse cached messages", e);
      }
    } else {
      setMessages([]);
      restoredRef.current = false;
    }
  }, [cacheKey]);

  useEffect(() => {
    try {
      localStorage.setItem(cacheKey, JSON.stringify(messages));
    } catch {}
  }, [messages, cacheKey]);

  useEffect(() => {
    if (!user?.id) return;
    fetchGiftInventory(user.id).then((inventory) => {
      console.log("🎁 Current Gift Inventory:", inventory);
    });
  }, [user?.id]);

  const personality = useMemo(() => {
    return (
      selectedPersonality || {
        name: currentCompanion?.personality_label || fallbackPersonality.name,
        tone: currentCompanion?.tone || fallbackPersonality.tone,
      }
    );
  }, [selectedPersonality, currentCompanion]);

  const companionName = useMemo(() => {
    if (!currentCompanion) return "Loading...";
    if (currentCompanion.custom_name?.trim()) return currentCompanion.custom_name.trim();
    const model = models.find((m) => m.id === currentCompanion.model_id);
    return model?.name || "Unknown";
  }, [currentCompanion]);

  const matchedArchetype = useMemo(() => {
    return intimacyArchetypes.find(
      (a) =>
        a.verbal === currentCompanion?.verbal_intimacy &&
        a.physical === currentCompanion?.physical_intimacy
    );
  }, [currentCompanion]);

  const userTier = useMemo(() => {
    return isGuest ? "sample" : (getUserTier(user?.profile) || "free");
  }, [user, isGuest]);

  const giftUnlocks = useMemo(() => getGiftUnlocks(user?.profile), [user]);

  const reachedLimit = useMemo(() => {
    const now = new Date();
    const hasUnlimited = unlimitedUntil && now < new Date(unlimitedUntil);
    const maxMessages = tierCaps[userTier] ?? 0;
    const effectiveLimit = hasUnlimited ? Infinity : maxMessages + bonusMessages;
    return questionCount >= effectiveLimit;
  }, [questionCount, bonusMessages, unlimitedUntil, userTier]);

  const sendMessage = async () => {
    if (!input.trim() || inputDisabled || !personality) return;

    if (reachedLimit) {
      setShowGifts(true);
      setTimeout(() => {
        giftPanelRef?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
      return;
    }

    const userMessage = { id: Date.now(), text: input.trim(), sender: "user" };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setIsTyping(false);

    const payload = {
      message: userMessage.text,
      text: userMessage.text,
      personalityName: personality.name,
      tone: personality.tone,
      customName: companionName,
      modelName: currentCompanion?.model_id,
      model_id: currentCompanion?.model_id,
      companion_id: currentCompanion?.companion_id,
      companionId: currentCompanion?.companion_id,
      user_id: user?.id,
      userId: user?.id,
    };

    const now = new Date();
    const hasUnlimited = unlimitedUntil && now < new Date(unlimitedUntil);
    const maxMessages = tierCaps[userTier] ?? 0;
    const effectiveLimit = hasUnlimited ? Infinity : maxMessages + bonusMessages;

    const endpoint = isGuest ? "/api/chat/preview" : "/api/chat/send";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const raw = await res.text();
      let body = null;
      try {
        body = raw ? JSON.parse(raw) : null;
      } catch {}

      if (res.status === 404) {
        setMessages((prev) => [
          ...prev,
          { id: Date.now(), sender: "ai", text: "⚠️ endpoint_not_found" },
        ]);
        setIsTyping(false);
        setIsLoading(false);
        return;
      }

      if (!res.ok) {
        const reason = body?.error || body?.detail || body?.message || `HTTP_${res.status}`;
        setMessages((prev) => [
          ...prev,
          { id: Date.now(), sender: "ai", text: `⚠️ ${reason}` },
        ]);
        setIsTyping(false);
        setIsLoading(false);
        return;
      }

      let replyText =
        body?.reply ??
        body?.choices?.[0]?.message?.content ??
        body?.data?.choices?.[0]?.message?.content ??
        body?.output_text ??
        body?.text ??
        "";

      if (typeof replyText !== "string") replyText = "";
      replyText = replyText.trim();

      if (!replyText) {
        setMessages((prev) => [
          ...prev,
          { id: Date.now(), sender: "ai", text: "⚠️ empty_reply" },
        ]);
        setIsTyping(false);
        setIsLoading(false);
        return;
      }

      const typingDuration = Math.max(600, Math.min(4000, replyText.length * 25));
      setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          setMessages((prev) => [...prev, { id: Date.now() + 1, text: replyText, sender: "ai" }]);
          setIsTyping(false);
          setIsLoading(false);
          setQuestionCount((prev) => prev + 1);

          if (body) {
            setChatContext({
              moodGreeting: body.moodGreeting || null,
              memoryFacts: body.memoryFacts || [],
              verbalLevel: body.verbalLevel ?? null,
              physicalLevel: body.physicalLevel ?? null,
              subscriptionTier: body.subscriptionTier || "free",
            });
          }

          if (questionCount + 1 >= effectiveLimit) {
            setTimeout(() => {
              setMessages((prev) => [
                ...prev,
                { id: Date.now() + 2, sender: "ai", text: "__MESSAGE_LIMIT_REACHED__" },
              ]);
              setInputDisabled(true);
            }, 600);
          }
        }, typingDuration);
      }, 250);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 3, sender: "ai", text: "⚠️ request_failed" },
      ]);
      setIsTyping(false);
      setIsLoading(false);
    }
  };

  // Gift handler (accept gift object OR id/name string)
  const handleGiftUsed = async (giftLike) => {
    if (!user || !currentCompanion) return;

    const gift = resolveGift(giftLike);
    if (!gift || !gift.id || !gift.price) {
      console.warn("Ignoring unknown gift payload:", giftLike);
      return;
    }

    const userTokens = Number(user?.profile?.tokens ?? 0);
    if (userTokens < gift.price) {
      toast.error("Not enough tokens");
      return;
    }
    if (isApplyingGift) {
      toast("Hold on—still sending the previous gift…");
      return;
    }

    setIsApplyingGift(true);
    setApplyingGiftId(gift.id);

    // Local effects (optimistic)
    const effect = gift.effect || {};
    if (effect.extraMessages) setBonusMessages((prev) => prev + effect.extraMessages);
    if (effect.unlimited) {
      const hours = Number(effect.unlimited) || 0;
      if (hours > 0) {
        const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
        setUnlimitedUntil(expiresAt);
      }
    }
    if (effect.emotion) {
      const emotionLine = {
        cozy: "Mmm... you always know how to warm my heart. 🍵",
        alert: "You’re trying to keep me up late, aren’t you? ☕",
        joy: "Boba?! You angel!! 🧋💕",
        excited: "Let’s GO. I’m feeling hyped! 🥤",
      }[effect.emotion];
      if (emotionLine) {
        setMessages((prev) => [...prev, { id: Date.now() + 5, text: emotionLine, sender: "ai" }]);
      }
    }

    // Optimistic token update
    const oldBalance = userTokens;
    const newBalance = Math.max(0, oldBalance - gift.price);
    useAuthStore.getState()?.updateUserProfile?.({ tokens: newBalance });

    try {
      // Send canonical id to backend
      const result = await applyGiftToCompanion({
        user_id: user.id,
        companion_id: currentCompanion.companion_id,
        giftId: gift.id,
        giftName: gift.id, // keep as id; backend can map to display if needed
      });
      if (!result?.success) throw new Error(result?.error || "Gift apply failed");

      await updateUserTokenBalance(user.id, newBalance);

      setActiveGift(gift.id); // keep id for logic; UI can map to pretty name
      toast.success(`Sent ${gift.name || gift.id}! -${gift.price} tokens`);
    } catch (err) {
      // Rollback
      useAuthStore.getState()?.updateUserProfile?.({ tokens: oldBalance });
      toast.error(`Couldn't send ${gift.name || gift.id}. No tokens deducted.`);
      console.warn("Gift application failed:", err);
    } finally {
      setIsApplyingGift(false);
      setApplyingGiftId(null);
    }
  };

  // Greeting
  useGreetingMessage({
    messages,
    personality,
    companionName,
    matchedArchetype,
    memoryEnabled,
    setMessages,
    restored: restoredRef.current,
  });

  // Memory check (real companions only)
  useEffect(() => {
    if (!user?.id || !currentCompanion?.companion_id) return;

    // preview mode: never call the API
    if (
      currentCompanion.companion_id === "HOSTESS_RIKA_ID" ||
      currentCompanion.is_preview
    ) {
      setMemoryEnabled(false);
      return;
    }

    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/check-memory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: user.id, // tolerated by server though unused
            companion_id: currentCompanion.companion_id,
          }),
        });
        if (!res.ok) {
          if (alive) setMemoryEnabled(false);
          return;
        }
        const data = await res.json().catch(() => ({}));
        if (alive) setMemoryEnabled(!!data?.memoryEnabled);
      } catch {
        if (alive) setMemoryEnabled(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [user?.id, currentCompanion?.companion_id, currentCompanion?.is_preview]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  return {
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
    // gift lock state to GiftPanel
    isApplyingGift,
    applyingGiftId,
    userTier,
    giftUnlocks,
    bonusMessages,
    unlimitedUntil,
    questionCount,
    chatContext,
  };
}
