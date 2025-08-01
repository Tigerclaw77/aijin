"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import useGreetingMessage from "../hooks/useGreetingMessage";
import { intimacyArchetypes } from "../data/intimacy";
import { models } from "../data/models";
import { updateCompanionIntimacy } from "../utils/intimacyApiClient";
import { getUserTier, getGiftUnlocks } from "../utils/chatUtils";
import { supabase } from "../utils/supabaseClient";
import { fetchGiftInventory } from "../utils/fetchGiftInventory";
import { applyGiftToCompanion } from "../utils/applyGiftToCompanion";

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
  premium: Infinity,
};

export default function useChatLogic({
  user,
  currentCompanion,
  selectedPersonality,
  setCurrentCompanion = () => {},
  setActiveGift = () => {},
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

  const messagesEndRef = useRef(null);
  const cacheKeyRef = useRef("chat_guest");

  const isGuest = !user || !currentCompanion?.companion_id;
  const endpoint = isGuest ? "/api/chat-preview" : "/api/chat";

  useEffect(() => {
    if (user?.id && currentCompanion?.companion_id) {
      cacheKeyRef.current = `chat_${user.id}_${currentCompanion.companion_id}`;
    } else {
      cacheKeyRef.current = "chat_guest";
    }
  }, [user, currentCompanion]);

  useEffect(() => {
    if (!user?.id) return;
    fetchGiftInventory(user.id).then((inventory) => {
      console.log("🎁 Current Gift Inventory:", inventory);
    });
  }, [user?.id]);

  // useEffect(() => {
  //   const hydrateCompanion = async () => {
  //     if (!user?.id || currentCompanion?.companion_id) return;

  //     const { data, error } = await supabase
  //       .from("companions")
  //       .select("*")
  //       .eq("user_id", user.id)
  //       .order("created_at", { ascending: false })
  //       .limit(1)
  //       .maybeSingle();

  //     if (data && !error) {
  //       setCurrentCompanion(data);
  //     }
  //   };

  //   hydrateCompanion();
  // }, [user, currentCompanion, setCurrentCompanion]);

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
    if (currentCompanion.custom_name?.trim())
      return currentCompanion.custom_name.trim();
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
    return isGuest ? "sample" : getUserTier(user?.profile);
  }, [user, isGuest]);

  const giftUnlocks = useMemo(() => getGiftUnlocks(user?.profile), [user]);

  const reachedLimit = useMemo(() => {
    const bobaActive = giftUnlocks?.bobaActive;
    const baseLimit = tierCaps[userTier] || 0;
    const extra =
      (giftUnlocks?.tea || 0) * 10 +
      (giftUnlocks?.coffee || 0) * 25 +
      bonusMessages;
    const effective = bobaActive ? Infinity : baseLimit + extra;
    return questionCount >= effective;
  }, [questionCount, userTier, giftUnlocks, bonusMessages]);

  const sendMessage = async () => {
    if (!input.trim() || inputDisabled || !personality || reachedLimit) return;

    const userMessage = { id: Date.now(), text: input.trim(), sender: "user" };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setIsTyping(false);

    const payload = {
      message: userMessage.text,
      personalityName: personality.name,
      tone: personality.tone,
      customName: companionName,
      modelName: currentCompanion?.model_id,
      companion_id: currentCompanion?.companion_id,
      user_id: user?.id,
    };

    const delayBeforeTyping = 2500;
    const now = new Date();
    const hasUnlimited = unlimitedUntil && now < new Date(unlimitedUntil);
    const maxMessages = tierCaps[userTier] || 0;
    const effectiveLimit = hasUnlimited
      ? Infinity
      : maxMessages + bonusMessages;

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const rawText = await res.text();
      const data = JSON.parse(rawText);
      const replyText = data.reply || "Let's keep chatting!";
      const typingDuration = Math.max(1000, replyText.length * 30);

      setTimeout(() => {
        setIsTyping(true);
        setTimeout(async () => {
          setMessages((prev) => [
            ...prev,
            { id: Date.now() + 1, text: replyText, sender: "ai" },
          ]);
          setIsTyping(false);
          setIsLoading(false);
          setQuestionCount((prev) => prev + 1);

          if (user?.id && currentCompanion?.companion_id) {
            try {
              await updateCompanionIntimacy(
                user.id,
                currentCompanion.companion_id
              );
            } catch (e) {
              console.error("Failed to update companion intimacy:", e);
            }
          }

          if (questionCount + 1 >= effectiveLimit) {
            setTimeout(() => {
              setMessages((prev) => [
                ...prev,
                {
                  id: Date.now() + 2,
                  sender: "ai",
                  text: "__MESSAGE_LIMIT_REACHED__",
                },
              ]);
              setInputDisabled(true);
            }, 1000);
          }
        }, typingDuration);
      }, delayBeforeTyping);
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

  const handleGiftUsed = async (gift) => {
    if (!user || !currentCompanion) return;

    const userTokens = user.profile?.tokens || 0;
    if (userTokens < gift.price) {
      console.warn("⛔ Not enough tokens");
      return;
    }

    const effect = gift.effect || {};

    if (effect.extraMessages) {
      setBonusMessages((prev) => prev + effect.extraMessages);
    }

    if (effect.unlimited) {
      const hours = effect.unlimited;
      const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
      setUnlimitedUntil(expiresAt);
    }

    if (effect.emotion) {
      const emotionLine = {
        cozy: "Mmm... you always know how to warm my heart. 🍵",
        alert: "You’re trying to keep me up late, aren’t you? ☕",
        joy: "Boba?! You angel!! 🧋💕",
        excited: "Let’s GO. I’m feeling hyped! 🥤",
      }[effect.emotion];

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 5,
          text: emotionLine || "Aww, thank you for the gift!",
          sender: "ai",
        },
      ]);
    }

    try {
      await applyGiftToCompanion({
        user_id: user.id,
        companion_id: currentCompanion.companion_id,
        giftName: gift.name,
      });
      console.log(`✅ Gift XP applied for ${gift.name}`);
    } catch (error) {
      console.error("❌ Failed to apply gift XP:", error);
    }

    setActiveGift(gift.name);
  };

  useEffect(() => {
    const cached = localStorage.getItem(cacheKeyRef.current);
    if (cached) {
      try {
        setMessages(JSON.parse(cached));
      } catch (e) {
        console.error("Failed to parse cached messages", e);
      }
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(cacheKeyRef.current, JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    return () => {
      localStorage.removeItem(cacheKeyRef.current);
    };
  }, []);

  useGreetingMessage({
    messages,
    personality,
    companionName,
    matchedArchetype,
    memoryEnabled,
    setMessages,
  });

  useEffect(() => {
    if (!user || !currentCompanion?.companion_id) return;
    const checkMemory = async () => {
      try {
        const res = await fetch("/api/check-memory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: user.id,
            companion_id: currentCompanion.companion_id,
          }),
        });
        const data = await res.json();
        setMemoryEnabled(data.memoryEnabled);
      } catch (err) {
        console.error("Failed to check memory status:", err);
        setMemoryEnabled(false);
      }
    };
    checkMemory();
  }, [user, currentCompanion]);

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
    userTier,
    giftUnlocks,
    bonusMessages,
    unlimitedUntil,
    questionCount,
    cacheKeyRef,
  };
}
