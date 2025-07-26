import { supabase } from "./supabaseClient";

// ✅ Fetch the selected_companion_id from the user's profile
export async function getUserCompanionId(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("selected_companion_id")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error fetching selected_companion_id:", error.message);
    return null;
  }

  return data.selected_companion_id || null;
}

// ✅ Optionally fetch the full companion object
export async function getCompanionById(companionId) {
  const { data, error } = await supabase
    .from("companions")
    .select("*")
    .eq("id", companionId)
    .single();

  if (error) {
    console.error("Error fetching companion:", error.message);
    return null;
  }

  return data;
}
