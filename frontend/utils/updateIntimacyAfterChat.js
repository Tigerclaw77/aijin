import { calculateBaseIntimacy } from "./calculateBaseIntimacy-old";
import { supabase } from "./supabaseClient";

/**
 * Update companion intimacy XP and levels.
 * Called once daily if interaction meets threshold.
 *
 * @param {object} companion - Companion object from Supabase.
 * @param {number} messagesToday - Count of user messages today
 * @param {string} type - 'verbal' or 'physical'
 */
export async function updateIntimacyAfterChat(
  companion,
  messagesToday,
  type = "verbal"
) {
  if (!companion || messagesToday < 1) return;

  const isVerbal = type === "verbal";
  const curveType = isVerbal
    ? companion.verbal_curve_type
    : companion.physical_curve_type;
  const levelField = isVerbal ? "verbal_level" : "physical_level";
  const xpField = isVerbal ? "verbal_xp" : "physical_xp";
  const maxXPField = isVerbal ? "verbal_max_xp" : "physical_max_xp";
  const startDate = new Date(companion.created_at);
  const today = new Date();

  const pausedDays = companion.paused_days || 0;
  const daysSinceStart = Math.floor(
    (today - startDate) / (1000 * 60 * 60 * 24)
  );
  const effectiveDays = Math.max(0, daysSinceStart - pausedDays);

  const { score } = calculateBaseIntimacy({
    curveType,
    msgCount: messagesToday,
    daysSinceStart: effectiveDays,
    pausedDays,
  });

  const newXP = parseFloat(score.toFixed(2));
  const oldXP = companion[xpField] || 0;
  const level = companion[levelField] || 1;
  const maxXP = companion[maxXPField] || 100;

  const xpTotal = oldXP + newXP;
  const didLevelUp = xpTotal >= maxXP;

  const updates = {
    [xpField]: didLevelUp ? xpTotal - maxXP : xpTotal,
    [levelField]: didLevelUp ? level + 1 : level,
  };

  const { error } = await supabase
    .from("companions")
    .update(updates)
    .eq("companion_id", companion.companion_id);

  if (error) {
    console.error(`❌ Failed to update ${type} intimacy:`, error);
  } else {
    console.log(`✅ ${type} intimacy updated:`, updates);
  }
}
