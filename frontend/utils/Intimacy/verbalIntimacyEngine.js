import { calculateGiftXP } from "./calculateGiftXP";
import { levelFromXP as calculateBaseIntimacy } from "./intimacyLevels";

/**
 * Compute today's verbal intimacy delta based on XP and growth curve.
 * @param {object} companion - Supabase companion row
 * @param {number} messagesToday
 * @param {Date} [now]
 * @returns {number} delta - Change in verbal intimacy today
 */
export function calculateVerbalIntimacyXP(companion, messagesToday, now = new Date()) {
  if (!companion) return 0;

  const curveType = companion.verbal_curve_type;
  const createdAt = new Date(companion.created_at);
  const pausedDays = companion.paused_days || 0;

  const daysSinceStart = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
  const effectiveDays = Math.max(0, daysSinceStart - pausedDays);

  // Step 1: XP from chat (curve + msgs + adjusted time)
  const { score: chatXP } = calculateBaseIntimacy({
    curveType,
    msgCount: messagesToday,
    daysSinceStart: effectiveDays,
    pausedDays,
  });

  // Step 2: XP from gifts
  const giftXP = calculateGiftXP(companion.gift_data || [], "verbal", now);
  const totalXP = parseFloat((chatXP + giftXP).toFixed(2));

  // Step 3: Rank defaults to 3 if unset
  const rank = companion.verbal_level ?? 3;

  // Step 4: Final intimacy delta
  const delta = calculateDailyIntimacyDelta(
    rank,
    totalXP,
    messagesToday,
    companion.gift_data || [],
    now,
    "verbal"
  );

  return parseFloat(delta.toFixed(4));
}
