// utils/updateCompanionIntimacy.js
import { calculateBaseIntimacy } from "../components/intimacy/BaseIntimacy";
import { supabase } from "../utils/supabaseClient";

export async function updateCompanionIntimacy(companion_id) {
  const { data: comp, error } = await supabase
    .from("companions")
    .select("*")
    .eq("companion_id", companion_id)
    .single();

  if (error || !comp) {
    console.error("❌ Failed to fetch companion:", error);
    return;
  }

  const created = new Date(comp.created_at);
  const now = new Date();
  const daysSinceStart = Math.floor((now - created) / 86400000); // ms to days
  const effectiveDays = Math.max(0, daysSinceStart - (comp.paused_days || 0));
  const msgCount = comp.messages_today || 0;

  const verbal = calculateBaseIntimacy({
    curveType: comp.verbal_curve_type,
    msgCount,
    daysSinceStart: effectiveDays,
    pausedDays: 0, // already subtracted
  });

  const physical = calculateBaseIntimacy({
    curveType: comp.physical_curve_type,
    msgCount,
    daysSinceStart: effectiveDays,
    pausedDays: 0,
  });

  // 🔒 Validate calculation results to prevent NaN/undefined update
  const valid =
    verbal &&
    physical &&
    Number.isFinite(verbal.rank) &&
    Number.isFinite(verbal.score) &&
    Number.isFinite(physical.rank) &&
    Number.isFinite(physical.score);

  if (!valid) {
    console.error("❌ Invalid intimacy calculation results:", { verbal, physical });
    return;
  }

  const { error: updateError } = await supabase
    .from("companions")
    .update({
      verbal_level: verbal.rank,
      verbal_xp: verbal.score,
      physical_level: physical.rank,
      physical_xp: physical.score,
    })
    .eq("companion_id", companion_id);

  if (updateError) {
    console.error("❌ Error updating intimacy:", updateError);
  } else {
    console.log("✅ Companion intimacy updated:", {
      companion_id,
      verbal,
      physical,
    });
  }
}
