import { supabase } from "./supabaseClient";

export async function fetchUserCompanions(user_id) {
  const { data, error } = await supabase
    .from("companions")
    .select("*")
    .eq("user_id", user_id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching companions:", error);
    return [];
  }

  return data;
}
