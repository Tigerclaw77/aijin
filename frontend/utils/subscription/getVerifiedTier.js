// /utils/subscription/getVerifiedTier.js
import { supabase } from "../Supabase/supabaseClient";

export function normalizeTier(t) {
  if (!t) return "free";
  const x = String(t).toLowerCase();
  if (x === "premium") return "girlfriend";
  return x;
}

export async function getVerifiedTier(user_id) {
  const { data, error } = await supabase
    .from("profiles")
    .select("subscription_tier")
    .eq("id", user_id)
    .single();

  if (error) {
    console.error("getVerifiedTier error:", error.message);
    return { tier: "free", updated: false };
  }

  const normalized = normalizeTier(data?.subscription_tier);
  if (normalized !== data?.subscription_tier) {
    const { error: upErr } = await supabase
      .from("profiles")
      .update({ subscription_tier: normalized })
      .eq("id", user_id);

    if (upErr) {
      console.error("Tier normalize update failed:", upErr.message);
      return { tier: normalized, updated: false };
    }
    return { tier: normalized, updated: true };
  }

  return { tier: normalized, updated: false };
}

export function discountedPrice(base, tier) {
  // discounts apply ONLY to the 4 chat drinks per your rule
  if (tier === "girlfriend") return Math.floor(base * 0.75);
  if (tier === "waifu") return Math.floor(base * 0.50);
  return base;
}
