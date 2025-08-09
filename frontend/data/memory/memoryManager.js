// @ts-check
/// <reference path="./memoryTypes.d.ts" />

import { OpenAI } from "openai";
import { supabaseServer } from "../../utils/Supabase/supabaseServerClient";

// ✅ OpenRouter setup
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "https://aijin.ai",
    "X-Title": "Aijin AI Companion",
  },
});

/**
 * Case-insensitive check if text contains a keyword
 * @param {string} text
 * @param {string} keyword
 * @returns {boolean}
 */
function includesKeyword(text, keyword) {
  return text.toLowerCase().includes(keyword.toLowerCase());
}

/**
 * Get relevant memory summaries for a given input
 * @param {string} user_id
 * @param {string} companion_id
 * @param {string} inputText
 * @returns {Promise<string[]>}
 */
export async function getRelevantMemory(user_id, companion_id, inputText) {
  const { data: record, error } = await supabaseServer
    .from("memories")
    .select("content")
    .eq("user_id", user_id)
    .eq("companion_id", companion_id)
    .maybeSingle();

  if (error) {
    console.error("❌ Supabase error (getRelevantMemory):", error);
    return [];
  }

  const memories = record?.content || [];

  return memories
    .filter((mem) => mem.keywords?.some((kw) => includesKeyword(inputText, kw)))
    .map((mem) => mem.summary);
}

/**
 * @param {string} user_id
 * @param {string} companion_id
 * @param {MemoryBlock} memoryBlock
 * @returns {Promise<MemoryBlock>}
 */
export async function addMemory(user_id, companion_id, memoryBlock) {
  memoryBlock.id = `mem_${Date.now()}`;
  memoryBlock.createdAt = new Date().toISOString();
  memoryBlock.lastReinforced = memoryBlock.createdAt;

  const { data: existing, error: selectError } = await supabaseServer
    .from("memories")
    .select("content")
    .eq("user_id", user_id)
    .eq("companion_id", companion_id)
    .maybeSingle();

  if (selectError) {
    console.error("❌ Supabase error (select):", selectError);
    return null;
  }

  let newMemories = [];

  if (existing?.content) {
    newMemories = [...existing.content, memoryBlock];
    const { error: updateError } = await supabaseServer
      .from("memories")
      .update({ content: newMemories })
      .eq("user_id", user_id)
      .eq("companion_id", companion_id);
    if (updateError) console.error("❌ Supabase error (update):", updateError);
  } else {
    newMemories = [memoryBlock];
    const { error: insertError } = await supabaseServer
      .from("memories")
      .insert({
        user_id,
        companion_id,
        content: newMemories,
        type: "memory_blocks", // ✅ Type tag added
      });
    if (insertError) console.error("❌ Supabase error (insert):", insertError);
  }

  return memoryBlock;
}

/**
 * Refresh a memory's importance
 */
export async function reinforceMemory(user_id, companion_id, memory_id) {
  const { data: record, error } = await supabaseServer
    .from("memories")
    .select("content")
    .eq("user_id", user_id)
    .eq("companion_id", companion_id)
    .maybeSingle();

  if (error) {
    console.error("❌ Supabase error (reinforce):", error);
    return;
  }

  if (!record?.content) return;

  const updated = record.content.map((m) =>
    m.id === memory_id ? { ...m, lastReinforced: new Date().toISOString() } : m
  );

  const { error: updateError } = await supabaseServer
    .from("memories")
    .update({ content: updated })
    .eq("user_id", user_id)
    .eq("companion_id", companion_id);

  if (updateError) {
    console.error("❌ Supabase error (reinforce update):", updateError);
  }
}

/**
 * Get all memory for a user-companion
 */
export async function getAllMemory(user_id, companion_id) {
  const { data: record, error } = await supabaseServer
    .from("memories")
    .select("content")
    .eq("user_id", user_id)
    .eq("companion_id", companion_id)
    .maybeSingle();

  if (error) {
    console.error("❌ Supabase error (getAllMemory):", error);
    return [];
  }

  return record?.content || [];
}

/**
 * Inject relevant memory into a system prompt
 */
export async function injectMemoryToPrompt(
  user_id,
  companion_id,
  inputText,
  basePrompt
) {
  const memorySummaries = await getRelevantMemory(
    user_id,
    companion_id,
    inputText
  );
  if (!memorySummaries.length) return basePrompt;

  const memoryContext = `You remember these facts about the user:\n- ${memorySummaries.join(
    "\n- "
  )}`;

  return [{ role: "system", content: memoryContext }, ...basePrompt];
}

/**
 * AI-assisted memory extraction from chat history
 */
export async function extractMemoryFromChat(messages) {
  const prompt = `Extract long-term facts about the user or their life from this conversation:

${messages.map((m) => `${m.role}: ${m.content}`).join("\n")}

Respond in JSON like:
[
  {
    "label": "Paul's parents",
    "summary": "They live in Florida and have a cat named Mimi.",
    "keywords": ["parents", "Mimi", "Florida"],
    "type": "person",
    "details": {
      "location": "Florida",
      "pets": ["Mimi"]
    },
    "decayResistant": true
  }
]`;

  const response = await openai.chat.completions.create({
    model: "openrouter/openai/gpt-4o", // 🔁 Swap model here later if needed
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
  });

  try {
    const parsed = JSON.parse(response.choices[0].message.content);
    return parsed;
  } catch (e) {
    console.error("❌ Failed to parse extracted memory:", e);
    return [];
  }
}
