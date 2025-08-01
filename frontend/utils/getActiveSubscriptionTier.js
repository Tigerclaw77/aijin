// utils/getActiveSubscriptionTier.js
import { supabase } from "./supabaseClient";

export async function getActiveSubscriptionTier(user_id, companion_id) {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("tier")
    .eq("user_id", user_id)
    .eq("companion_id", companion_id)
    .eq("is_active", true)
    .lte("start_date", new Date().toISOString())
    .or("end_date.is.null,end_date.gt." + new Date().toISOString())
    .maybeSingle();

  if (error) {
    console.error("Error fetching tier:", error);
    return "free"; // fallback
  }

  return data?.tier || "free";
}
