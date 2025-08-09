import useCompanionStore from "../../store/companionStore";
import { intimacyArchetypes } from "../../data/intimacy";

import { supabase } from "../Supabase/supabaseClient";

let lastSavedHash = null;

export async function saveCompanionDataToSupabase({
  user_id,
  customName = "",
}) {
  const {
    selectedAvatar,
    selectedPersonality,
    selectedIntimacy,
    setCurrentCompanion,
  } = useCompanionStore.getState();

  if (
    !user_id ||
    !selectedAvatar?.id ||
    !selectedPersonality?.id ||
    selectedIntimacy?.verbal == null ||
    selectedIntimacy?.physical == null
  ) {
    return { success: false, error: "Missing required companion data." };
  }

  const companionName =
    customName.trim() || selectedAvatar.name || "Unnamed Companion";

  const matchedArchetype = intimacyArchetypes.find(
    (a) =>
      a.verbal === selectedIntimacy.verbal &&
      a.physical === selectedIntimacy.physical
  );
  const archetypeName = matchedArchetype?.name || "Custom";
  const archetypeId = matchedArchetype?.id || "custom";

  const saveHash = `${user_id}-${selectedAvatar.id}-${selectedPersonality.id}-${selectedIntimacy.verbal}-${selectedIntimacy.physical}-${companionName}`;
  if (saveHash === lastSavedHash) {
    console.warn("🚫 Prevented duplicate insert (same hash as last save).");
    return { success: false, error: "Duplicate submission prevented." };
  }
  lastSavedHash = saveHash;

  const { data: companion, error: insertError } = await supabase
    .from("companions")
    .insert([
      {
        companion_id: crypto.randomUUID(),
        user_id: user_id,
        custom_name: companionName,
        model_id: selectedAvatar.id,
        personality_id: selectedPersonality.id,
        avatar_image_url: selectedAvatar.image,
        intimacy_archetype: archetypeName,
        verbal_intimacy: selectedIntimacy.verbal,
        physical_intimacy: selectedIntimacy.physical,
        verbal_curve_type: selectedIntimacy.verbal,
        physical_curve_type: selectedIntimacy.physical,
        created_at: new Date().toISOString(),
        tier: "sample",
        status: "active",
      },
    ])
    .select("companion_id, *")
    .single();

  console.log("🧠 Debugging companion creation:");
  console.log("user_id:", user_id);
  console.log("selectedAvatar:", selectedAvatar);
  console.log("selectedPersonality:", selectedPersonality);
  console.log("selectedIntimacy:", selectedIntimacy);

  if (insertError) {
    console.error("❌ Supabase insert error:", insertError);
    return { success: false, error: insertError.message };
  }

  setCurrentCompanion(companion);

  return { success: true, data: companion };
}
