import { supabase } from "./supabaseClient";
import useCompanionStore from "../store/companionStore";
import { intimacyArchetypes } from "../data/intimacy"; // ✅ Import to resolve name

let lastSavedHash = null;

/**
 * Save a new companion to Supabase 'companions' table and link to user's profile.
 *
 * @param {string} userId - The Supabase user ID.
 * @param {string} [customName] - Optional user-defined name for the companion.
 * @returns {Promise<{ success: boolean, data?: object, error?: string }>}
 */
export async function saveCompanionDataToSupabase({ userId, customName = "" }) {
  const {
    selectedAvatar,
    selectedPersonality,
    selectedIntimacy,
    setCurrentCompanion,
  } = useCompanionStore.getState();

  console.log("⚙️ saveCompanionDataToSupabase called with:", {
    userId,
    customName,
    selectedAvatar,
    selectedPersonality,
    selectedIntimacy,
  });

  if (
    !userId ||
    !selectedAvatar ||
    !selectedPersonality ||
    selectedIntimacy?.verbal == null ||
    selectedIntimacy?.sexual == null
  ) {
    console.warn("⛔ Missing required data, aborting.");
    return { success: false, error: "Missing required companion data." };
  }

  const companionName = customName.trim() || selectedAvatar.name || "Unnamed Companion";

  // ✅ Resolve actual archetype name from verbal + sexual levels
  const matchedArchetype = intimacyArchetypes.find(
    (a) =>
      a.verbal === selectedIntimacy.verbal &&
      a.sexual === selectedIntimacy.sexual
  );
  const archetypeName = matchedArchetype?.name || "Custom";

  // 🧠 Duplicate prevention
  const saveHash = `${userId}-${selectedAvatar.id}-${selectedPersonality.id}-${selectedIntimacy.verbal}-${selectedIntimacy.sexual}-${companionName}`;
  if (saveHash === lastSavedHash) {
    console.warn("🚫 Prevented duplicate insert (same hash as last save).");
    return { success: false, error: "Duplicate submission prevented." };
  }
  lastSavedHash = saveHash;

  console.log("📤 Inserting new companion...");

  const { data: companion, error: insertError } = await supabase
    .from("companions")
    .insert([
      {
        user_id: userId,
        name: companionName,
        model_id: selectedAvatar.id,
        personality_id: selectedPersonality.id,
        intimacy_archetype: archetypeName,
        verbal_intimacy: selectedIntimacy.verbal,
        sexual_intimacy: selectedIntimacy.sexual,
        avatar_image_url: selectedAvatar.image,
        created_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (insertError) {
    console.error("🛑 Supabase insert error:", insertError);
    return { success: false, error: insertError.message };
  }

  console.log("✅ Companion inserted:", companion);

  // ✅ Store in Zustand for ChatBox etc.
  setCurrentCompanion(companion);

  // ✅ Update user's selected companion in profile
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      selected_companion_id: companion.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (updateError) {
    console.error("🛑 Failed to update profile with companion ID:", updateError);
    return { success: false, error: updateError.message };
  }

  console.log("✅ Profile updated successfully.");
  return { success: true, data: companion };
}
