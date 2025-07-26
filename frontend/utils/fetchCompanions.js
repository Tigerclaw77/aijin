import { supabase } from "./supabaseClient";

export async function fetchUserCompanions(userId) {
  const { data, error } = await supabase
    .from("companions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching companions:", error);
    return [];
  }

  return data;
}
