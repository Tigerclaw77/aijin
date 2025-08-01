import { calculateBaseIntimacy } from "./calculateBaseIntimacy"; // uses message count & curve
import { calculateGiftXP } from "./giftXPManager";

/**
 * Combine chat and gift XP to compute today's total XP for intimacy type
 *
 * @param {object} companion - Companion row from Supabase
 * @param {number} messagesToday - Number of messages sent today
 * @param {string} type - "verbal" or "physical"
 * @param {Date} [now] - Optional override for testing
 * @returns {number} totalXP - XP gained today
 */
export function calculateDailyIntimacyXP(companion, messagesToday, type = "verbal", now = new Date()) {
  if (!companion || !["verbal", "physical"].includes(type)) return 0;

  const isVerbal = type === "verbal";
  const curveType = isVerbal
    ? companion.verbal_curve_type
    : companion.physical_curve_type;

  const pausedDays = companion.paused_days || 0;
  const createdAt = new Date(companion.created_at);
  const daysSinceStart = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
  const effectiveDays = Math.max(0, daysSinceStart - pausedDays);

  const { score: chatXP } = calculateBaseIntimacy({
    curveType,
    msgCount: messagesToday,
    daysSinceStart: effectiveDays,
    pausedDays,
  });

  const giftXP = calculateGiftXP(companion.gift_data || [], type, now);

  return parseFloat((chatXP + giftXP).toFixed(2));
}
