// utils/giftXPManager.js

import { supabase } from "./supabaseClient";

/**
 * Immediately applies a gift to a companion, increasing XP
 * and logging it to gift_history.
 *
 * @param {Object} gift - Gift object from Supabase gift shop table
 * @param {string} user_id - UUID of the user giving the gift
 * @param {string} companion_id - UUID of the companion receiving the gift
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function applyGiftToCompanion(gift, user_id, companion_id) {
  if (!gift || !user_id || !companion_id) {
    return { success: false, error: "Missing gift, user, or companion info." };
  }

  const updates = {};
  if (gift.verbal_xp > 0) updates.verbal_xp = gift.verbal_xp;
  if (gift.physical_xp > 0) updates.physical_xp = gift.physical_xp;

  const { error: xpError } = await supabase
    .from("companions")
    .update({
      ...(updates.verbal_xp && { verbal_xp: supabase.raw(`verbal_xp + ${updates.verbal_xp}`) }),
      ...(updates.physical_xp && { physical_xp: supabase.raw(`physical_xp + ${updates.physical_xp}`) }),
    })
    .eq("companion_id", companion_id);

  if (xpError) {
    console.error("❌ Failed to apply gift XP:", xpError);
    return { success: false, error: "Failed to apply gift XP." };
  }

  const { error: logError } = await supabase.from("gift_history").insert([
    {
      user_id: user_id,
      companion_id: companion_id,
      gift_id: gift.id,
      given_at: new Date().toISOString(),
      verbal_xp: gift.verbal_xp,
      physical_xp: gift.physical_xp,
      half_life_hours: gift.half_life_hours,
      type: gift.type,
    },
  ]);

  if (logError) {
    console.error("❌ Failed to log gift:", logError);
    return { success: false, error: "Gift XP applied, but logging failed." };
  }

  console.log("🎁 Gift applied successfully.");
  return { success: true };
}
