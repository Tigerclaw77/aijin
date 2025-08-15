import { calculateGiftXP } from "./calculateGiftXP";
import { levelFromXP as calculateBaseIntimacy } from "./intimacyLevels";

/**
 * Compute today's physical intimacy delta based on XP and growth curve.
 * @param {object} companion - Supabase companion row
 * @param {number} messagesToday
 * @param {Date} [now]
 * @returns {number} delta - Change in physical intimacy today
 */
export function calculatePhysicalIntimacyXP(companion, messagesToday, now = new Date()) {
  if (!companion) return 0;

  const curveType = companion.physical_curve_type;
  const createdAt = new Date(companion.created_at);
  const pausedDays = companion.paused_days || 0;

  const daysSinceStart = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
  const effectiveDays = Math.max(0, daysSinceStart - pausedDays);

  // Step 1: Get XP from chat (based on curve + msg count + duration)
  const { score: chatXP } = calculateBaseIntimacy({
    curveType,
    msgCount: messagesToday,
    daysSinceStart: effectiveDays,
    pausedDays,
  });

  // Step 2: Get XP from gifts
  const giftXP = calculateGiftXP(companion.gift_data || [], "physical", now);
  const totalXP = parseFloat((chatXP + giftXP).toFixed(2));

  // Step 3: Determine current rank (defaults to 3 if not set)
  const rank = companion.physical_level ?? 3;

  // Step 4: Convert XP to intimacy delta
  const delta = calculateDailyIntimacyDelta(
    rank,
    totalXP,
    messagesToday,
    companion.gift_data || [],
    now,
    "physical"
  );

  return parseFloat(delta.toFixed(4));
}
