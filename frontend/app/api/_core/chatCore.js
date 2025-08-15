// app/api/_core/chatCore.js
export const runtime = "nodejs";

import { createClient } from "@supabase/supabase-js";

import { superviseIntimacyXP } from "../../../utils/Intimacy/superviseIntimacyXP";
import { getIntimacyRank } from "../../../utils/Intimacy/intimacyRankEngine";
import { getLastMessages } from "../../../utils/Memory/getLastMessages";
import { getRecentGifts } from "../../../utils/Chat-Gifts/getRecentGifts";
import { getRecentEmotionTag } from "../../../utils/Memory/emotionHelpers";
import { getTopMemoriesForInjection } from "../../../utils/Memory/getTopMemoriesForInjection";
import { getMoodGreeting } from "../../../utils/Memory/moodGreetingHelper";
import { getBehaviorModifier } from "../../../utils/prompt/promptModifiers";
import { getModelByTier, OPENROUTER_MODELS } from "../../../utils/models/openRouterConfig";
import { saveMemoryToSupabase } from "../../../utils/Memory/saveMemoryToSupabase";
import { calculateGiftXP } from "../../../utils/Chat-Gifts/giftUtils";

// Import both forms; use a safe wrapper to avoid TDZ issues
import applyTierCapDefault, {
  applyTierCap as applyTierCapNamed,
} from "../../../utils/Intimacy/applyTierCap";

/* ---------------------------- small helpers ---------------------------- */

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function getDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase configuration missing");
  return createClient(url, key, { auth: { persistSession: false } });
}

// whole-number caps by tier (free→1, friend→2, crush→3, girlfriend→4, waifu→5)
function getMaxForTier(tier) {
  const t = String(tier || "").toLowerCase();
  switch (t) {
    case "friend": return 2;
    case "crush": return 3;
    case "girlfriend": return 4;
    case "waifu": return 5;
    default: return 1; // free/unknown
  }
}

// server-side daily message limits (per companion)
const TIER_LIMITS = {
  free: 5, friend: 50, crush: 200, girlfriend: 500, waifu: 1000, premium: Infinity
};

const DEFAULT_MODEL = "nousresearch/nous-capybara-7b";
const FALLBACK_MODEL = "mistralai/mistral-7b-instruct";

async function callOpenRouter(messages, config = {}, subscriptionTier = "free") {
  const { model = DEFAULT_MODEL, max_tokens = 160, temperature = 0.65, stop } = config;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 30_000);

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, messages, max_tokens, temperature, stop }),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`OpenRouter HTTP ${res.status}: ${text}`);
    }
    return await res.json();
  } catch (err) {
    if (model !== FALLBACK_MODEL) {
      return await callOpenRouter(messages, { model: FALLBACK_MODEL, max_tokens, temperature, stop }, subscriptionTier);
    }
    throw err;
  } finally {
    clearTimeout(t);
  }
}

function toMessages(history) {
  return (history || []).slice(-14).map((m) => ({
    role: m.sender === "user" ? "user" : "assistant",
    content: (m.content || m.text || "").trim(),
  }));
}

// Defensive wrapper so we never hit TDZ and we always have a cap fn
function capIntimacy(level, tier, boost = 0) {
  const fn = applyTierCapNamed || applyTierCapDefault;
  try {
    return fn(level, tier, getMaxForTier, boost);
  } catch (e) {
    // Fallback: clamp to max-for-tier, with tiny boost
    const max = getMaxForTier(tier);
    return Math.min(Math.max(1, Math.round(level + (boost || 0))), max);
  }
}

/* -------------------------------- CORE -------------------------------- */

export async function handleChat(req, { preview = false } = {}) {
  const now = new Date();

  try {
    const body = await req.json().catch(() => ({}));

    /* --------- PREVIEW: no DB writes; tiny prompt; same style rules --------- */
    if (preview) {
      const { message, personalityName, customName, modelName } = body || {};
      const companionName = (customName || modelName || "your AI companion").toString().slice(0, 60);
      const userPrompt = (message ? String(message) : "Hi").slice(0, 500);

      const styleRules = `
Write like a real text: no quotes, no asterisks, first-person only.
1–2 concise sentences (≈35 words). If the user is terse, be equally short.
Do NOT start with a greeting/time-of-day unless the user does.
Answer the user's message directly before anything else.
`.trim();

      const systemPrompt = `
You are ${companionName}, a believable, affectionate young woman with the ${personalityName || "default"} personality.
Never mention AI, models, or limitations.
${styleRules}
`.trim();

      const data = await callOpenRouter(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        {
          model: "mistralai/mistral-7b-instruct",
          temperature: 0.6,
          max_tokens: 120,
          stop: ["As an AI", "as an AI", "Good morning", "Good afternoon", "Good evening"],
        },
        "free"
      );

      const reply = (data?.choices?.[0]?.message?.content || "").trim();
      if (!reply) return json({ error: "empty_reply" }, 502);
      return json({ reply });
    }

    /* ---------------------------- FULL CHAT FLOW ---------------------------- */
    const {
      message, text, companion_id: rawCompanionId, companionId,
      user_id: rawUserId, userId
    } = body || {};

    const companion_id = rawCompanionId || companionId;
    const user_id = rawUserId || userId;
    const userPrompt = (message || text || "").toString().slice(0, 1000) || "Hi";

    if (!user_id) return json({ error: "Missing field: user_id" }, 400);
    if (!companion_id) return json({ error: "Missing field: companion_id" }, 400);

    const db = getDb();

    // companion
    const { data: companion, error: compErr } = await db
      .from("companions")
      .select("*")
      .eq("companion_id", companion_id)
      .eq("user_id", user_id)
      .maybeSingle();

    if (compErr) return json({ error: "Companion fetch failed", dev: compErr.message }, 500);
    if (!companion) return json({ error: "Companion not found" }, 404);

    // profile/tier
    const { data: profile } = await db
      .from("profiles")
      .select("subscription_tier, is_admin")
      .eq("id", user_id)
      .maybeSingle();

    const subscriptionTier = profile?.subscription_tier || "free";
    const isAdmin = !!profile?.is_admin;

    // server-side message limit (per companion, last 24h)
    if (!isAdmin) {
      const historyForLimit = (await getLastMessages(user_id, companion_id, 200)) || [];
      const since = Date.now() - 24 * 3600 * 1000;
      const userLastDayCount = historyForLimit.filter(
        (m) => m.sender === "user" && new Date(m.created_at || m.timestamp || now).getTime() >= since
      ).length;
      const limit = TIER_LIMITS[subscriptionTier] ?? TIER_LIMITS.free;
      if (Number.isFinite(limit) && userLastDayCount >= limit) {
        return json({ error: "limit_reached", limit, window: "24h" }, 429);
      }
    }

    // intimacy update (best-effort)
    let verbalLevel = companion.verbal_level || 1;
    let physicalLevel = companion.physical_level || 1;
    try {
      const verbalXP = (companion.verbal_xp || 0) + superviseIntimacyXP(companion, 1, "verbal", now);
      const physicalXP = (companion.physical_xp || 0) + superviseIntimacyXP(companion, 1, "physical", now);
      verbalLevel = getIntimacyRank(verbalXP);
      physicalLevel = getIntimacyRank(physicalXP);

      await db
        .from("companions")
        .update({
          verbal_xp: verbalXP,
          physical_xp: physicalXP,
          verbal_level: verbalLevel,
          physical_level: physicalLevel,
          last_interaction: now.toISOString(),
        })
        .eq("companion_id", companion_id)
        .eq("user_id", user_id);
    } catch {
      // non-fatal
    }

    // gifts → optional XP boost that can gently affect caps
    let giftBoost = 0;
    try {
      const gifts = (await getRecentGifts(user_id, companion_id)) || [];
      giftBoost = Number(calculateGiftXP(gifts)) || 0; // use your own scale
    } catch {
      // soft-fail
    }

    const verbalLevelCapped = capIntimacy(verbalLevel, subscriptionTier, giftBoost);
    const physicalLevelCapped = capIntimacy(physicalLevel, subscriptionTier, giftBoost);

    // memory / chat context
    let memoryFactsRaw = [];
    let chatHistory = [];
    let moodGreeting = null;

    try {
      memoryFactsRaw = (await getTopMemoriesForInjection(user_id, companion_id, 10)) || [];
      chatHistory = (await getLastMessages(user_id, companion_id, 14)) || [];
      const recentEmotion = await getRecentEmotionTag(user_id, companion_id);
      moodGreeting = getMoodGreeting(recentEmotion);
    } catch {
      // best-effort
    }

    const memoryFacts =
      memoryFactsRaw.map((m) => `- ${m.content || m.text || ""}`).join("\n") || "No memories yet.";

    // behavior modifier (uses capped levels)
    let behaviorModifier = "";
    try {
      behaviorModifier = getBehaviorModifier(
        verbalLevelCapped,
        physicalLevelCapped,
        companion.intimacy_archetype || "Custom",
        companion.intimacy_description || "Unique behavior not in the preset archetypes."
      );
    } catch {
      // safe default
    }

    // simple tone classifier (optional)
    let emotionalTone = "casual";
    let physicalTone = "casual";
    try {
      const classifierModel = OPENROUTER_MODELS?.classifier;
      if (classifierModel) {
        const classifyRes = await callOpenRouter(
          [
            { role: "system", content: "Return only: emotional: [romantic|cold|casual], physical: [sexual|flirty|casual]" },
            { role: "user", content: userPrompt },
          ],
          { model: classifierModel, max_tokens: 15, temperature: 0 },
          subscriptionTier
        );
        const cls = classifyRes?.choices?.[0]?.message?.content?.toLowerCase() || "";
        emotionalTone = cls.match(/emotional:\s*(\w+)/)?.[1] || "casual";
        physicalTone = cls.match(/physical:\s*(\w+)/)?.[1] || "casual";
      }
    } catch {
      // ignore
    }

    // names & style
    const companionName =
      companion.customName || companion.name || companion.model_name || "your girl";

    const styleRules = `
Write like a real text: no quotes, no asterisks, first-person only.
1–2 concise sentences (≈35 words). If the user is terse, be equally short.
Do NOT start with a greeting/time-of-day unless the user's latest message greets first.
Answer the user's message directly before anything else.
Continue the current topic; track the last 2 user turns; never reset without being asked.
Never mention AI, models, or limitations.
`.trim();

    const systemPrompt = `
You are a romantic AI companion named ${companionName}. Stay in character.
${styleRules}
${behaviorModifier}
`.trim();

    const messages = [
      { role: "system", content: systemPrompt },
      {
        role: "assistant",
        content: `Context:
Personality: ${companion.tone || "gentle"}
Archetype: ${companion.intimacy_archetype || "Custom"}
Mood: ${moodGreeting || "neutral"}
User tier: ${subscriptionTier}
Detected tone: emotional=${emotionalTone}, physical=${physicalTone}
Memories:
${memoryFacts}`,
      },
      ...toMessages(chatHistory),
      { role: "user", content: userPrompt },
    ];

    // model config
    const baseCfg = getModelByTier(subscriptionTier) || {};
    const cfg = {
      ...baseCfg,
      temperature: Math.min(baseCfg.temperature ?? 0.9, 0.65),
      max_tokens: Math.min(baseCfg.max_tokens ?? 800, 160),
      stop: ["As an AI", "as an AI", "Good morning", "Good afternoon", "Good evening", "\nUser:", "\nAssistant:"],
    };

    let reply = "I'm here, sweetheart.";
    try {
      const aiRes = await callOpenRouter(messages, cfg, subscriptionTier);
      reply = aiRes?.choices?.[0]?.message?.content || reply;
    } catch (e) {
      console.warn("model error:", e?.message || e);
    }

    const safeReply = typeof reply === "string" ? reply.trim() : "";
    if (!safeReply) return json({ error: "empty_reply" }, 502);

    // save memory (best-effort)
    try {
      await saveMemoryToSupabase({ companion_id, user_id, content: safeReply, type: "text" });
    } catch {
      // non-fatal
    }

    return json({
      reply: safeReply,
      verbalLevel,
      physicalLevel,
      emotionalTone,
      physicalTone,
      memoryFacts: (memoryFactsRaw || []).map((m) => m?.content || m?.text || "").filter(Boolean),
      subscriptionTier,
    });
  } catch (err) {
    return json(
      {
        error: "Internal server error.",
        ...(process.env.NODE_ENV !== "production"
          ? { dev: err?.message, stack: String(err?.stack || "") }
          : {}),
      },
      500
    );
  }
}
