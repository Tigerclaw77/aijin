import { supabase } from "../Supabase/supabaseClient";

export async function fetchGiftInventory(user_id) {
  if (!user_id) return [];

  const { data, error } = await supabase
    .from("gift_inventory")
    .select("gift_id, quantity")
    .eq("user_id", user_id);

  if (error) {
    console.error("❌ Failed to fetch gift inventory:", error.message);
    return [];
  }

  return data;
}
