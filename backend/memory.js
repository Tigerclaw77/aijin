// backend/memory.js

import { supabaseServer } from "../shared/Supabase/supabaseServerClient";

/**
 * Save fact-based memory for a companion.
 * @param {string} userId - UUID of the user
 * @param {string} companionId - UUID of the companion
 * @param {Array} facts - Array of fact objects to save
 */

export async function saveFactMemory(userId, companionId, facts = []) {
  const { error } = await supabaseServer.from("memories").upsert(
    [
      {
        user_id: userId,
        companion_id: companionId,
        type: "fact",
        content: { facts },
        updated_at: new Date().toISOString(),
      },
    ],
    {
      onConflict: "user_id,companion_id,type",
    }
  );

  if (error) console.error("Error saving fact memory:", error);
}

export async function getFactMemory(userId, companionId) {
  const { data, error } = await supabaseServer
    .from("memories")
    .select("content")
    .eq("user_id", userId)
    .eq("companion_id", companionId)
    .eq("type", "fact")
    .single();

  if (error) {
    console.warn("No fact memory found:", error.message);
    return [];
  }

  return data.content?.facts || [];
}

export async function saveShortTermMemory(userId, companionId, history = []) {
  const { error } = await supabaseServer.from("memories").upsert(
    [
      {
        user_id: userId,
        companion_id: companionId,
        type: "short-term",
        content: { history },
        updated_at: new Date().toISOString(),
      },
    ],
    {
      onConflict: "user_id,companion_id,type",
    }
  );

  if (error) console.error("Error saving short-term memory:", error);
}

export async function getShortTermMemory(userId, companionId) {
  const { data, error } = await supabaseServer
    .from("memories")
    .select("content")
    .eq("user_id", userId)
    .eq("companion_id", companionId)
    .eq("type", "short-term")
    .single();

  if (error) {
    console.warn("No short-term memory found:", error.message);
    return [];
  }

  return data.content?.history || [];
}

export async function appendShortTermMessage(userId, companionId, message) {
  const history = await getShortTermMemory(userId, companionId);
  const updated = [...history, message].slice(-10); // Keep last 10 messages max
  await saveShortTermMemory(userId, companionId, updated);
}
