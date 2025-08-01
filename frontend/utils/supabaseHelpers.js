// utils/companionUtils.js

import { supabase } from "./supabaseClient";

/**
 * Fetches the selected_companion_id from the user's profile.
 * @param {string} user_id - Supabase user ID
 * @returns {Promise<string|null>} - The selected companion_id or null
 */
export async function getUserCompanionId(user_id) {
  const { data, error } = await supabase
    .from("profiles")
    .select("selected_companion_id")
    .eq("user_id", user_id)
    .single();

  if (error) {
    console.error("❌ Error fetching selected_companion_id:", error.message);
    return null;
  }

  return data?.selected_companion_id || null;
}

/**
 * Fetches the full companion object by companion_id.
 * @param {string} companion_id - Unique identifier for the companion
 * @returns {Promise<object|null>} - The companion object or null
 */
export async function getCompanionById(companion_id) {
  const { data, error } = await supabase
    .from("companions")
    .select("*")
    .eq("companion_id", companion_id)
    .single();

  if (error) {
    console.error("❌ Error fetching companion:", error.message);
    return null;
  }

  return data || null;
}
