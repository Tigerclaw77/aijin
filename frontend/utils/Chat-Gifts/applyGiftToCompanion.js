import { supabase } from "../../utils/Supabase/supabaseClient";

import { giftCatalog } from "../Chat-Gifts/giftUtils";

/**
 * Optional helper to cleanly fetch gift metadata from giftCatalog
 */
export function getGiftEffectMeta(giftId) {
  const cleanId = giftId.trim().toLowerCase();
  return giftCatalog[cleanId] || null;
}

/**
 * Applies XP from a gift to a companion's intimacy fields and logs the gift.
 *
 * @param {object} options
 * @param {string} options.user_id
 * @param {string} options.companion_id
 * @param {string} options.giftName
 */
export async function applyGiftToCompanion({
  user_id,
  companion_id,
  giftName,
}) {
  if (!user_id || !companion_id || !giftName) {
    console.warn("🛑 Missing required gift data");
    return { success: false, error: "Missing user or companion info." };
  }

  const effect = getGiftEffectMeta(giftName);

  if (!effect) {
    console.warn(`❌ Gift effect not found for "${giftName}"`);
    return { success: false, error: `Unknown gift: ${giftName}` };
  }

  const now = new Date();
  const baseXP = (effect.value || 0) * 1000; // Scale value to XP (adjust if needed)
  const decayFactor = 1; // You can apply real-time decay here if needed

  const verbalXP =
    effect.type === "verbal" || effect.type === "both"
      ? baseXP * decayFactor
      : 0;
  const physicalXP =
    effect.type === "physical" || effect.type === "both"
      ? baseXP * decayFactor
      : 0;

  const { data: companion, error: fetchError } = await supabase
    .from("companions")
    .select("verbal_xp, physical_xp, is_paused, soft_deleted")
    .eq("companion_id", companion_id)
    .single();

  if (fetchError || !companion) {
    console.error("❌ Companion not found:", fetchError);
    return { success: false, error: "Companion not found." };
  }

  if (companion.soft_deleted || companion.is_paused) {
    return {
      success: false,
      error: "Cannot apply gift to paused or deleted companion.",
    };
  }

  const updatedFields = {
    verbal_xp: (companion.verbal_xp || 0) + verbalXP,
    physical_xp: (companion.physical_xp || 0) + physicalXP,
  };

  const { error: updateError } = await supabase
    .from("companions")
    .update(updatedFields)
    .eq("companion_id", companion_id);

  if (updateError) {
    console.error("❌ Failed to apply XP:", updateError);
    return { success: false, error: "Failed to update companion XP." };
  }

  await supabase.from("gift_history").insert([
    {
      user_id,
      companion_id,
      gift_id: giftName.trim().toLowerCase(),
      given_at: now.toISOString(),
    },
  ]);

  return { success: true };
}
