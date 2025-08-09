// /utils/Memory/getLastMessages.js
import { supabaseServer } from "../Supabase/supabaseServerClient";

/**
 * Fetches the last N user/companion messages from memory.
 * @param {string} user_id
 * @param {string} companion_id
 * @param {number} limit
 * @returns {Promise<Array>} Array of memory entries (descending order)
 */
export async function getLastMessages(user_id, companion_id, limit = 5) {
  const { data, error } = await supabaseServer
    .from("memories")
    .select("content, created_at")
    .eq("user_id", user_id)
    .eq("companion_id", companion_id)
    .eq("type", "text")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("⚠️ getLastMessages failed:", error.message);
    return [];
  }

  return data || [];
}
