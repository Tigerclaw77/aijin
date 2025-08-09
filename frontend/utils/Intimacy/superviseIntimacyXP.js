import { calculateDailyIntimacyDelta, calculateDecayAmount } from "./intimacyGrowthCurves";
import { isGiftEffectActive as hasGiftPauseActive, calculateGiftXP } from "../Chat-Gifts/giftUtils";

/**
 * Full supervisor: handles gain OR decay for one intimacy type
 * @param {object} companion - Companion row from Supabase
 * @param {number} messagesToday - Messages sent today
 * @param {'verbal'|'physical'} type - Intimacy type
 * @param {Date} [now]
 * @returns {number} XP delta (positive = gain, negative = decay, 0 = paused)
 */
export function superviseIntimacyXP(
  companion,
  messagesToday,
  type = "verbal",
  now = new Date()
) {
  if (!companion || !["verbal", "physical"].includes(type)) return 0;

  const createdAt = new Date(companion.created_at);
  const pausedDays = companion.paused_days || 0;
  const daysSinceStart = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
  const effectiveDays = Math.max(0, daysSinceStart - pausedDays);
  const x = Math.min(1, effectiveDays / 60); // normalized for growth curve

  const giftBonus = calculateGiftXP(companion.gift_data || [], type, now);
  const curveType =
    type === "verbal"
      ? companion.verbal_curve_type
      : companion.physical_curve_type;
  const rank =
    type === "verbal"
      ? companion.verbal_level
      : companion.physical_level;

  if (messagesToday >= 1) {
    // User is active, apply growth
    return calculateDailyIntimacyDelta({
      curveType,
      interactionX: x,
      msgsToday: messagesToday,
      giftBonus,
    });
  }

  const isPaused = !!companion.paused_days;
  const isGiftPaused = hasGiftPauseActive(companion.gift_data || [], type, now);

  if (isPaused || isGiftPaused) return 0;

  // Inactive and not paused — apply decay
  const lastInteraction = new Date(
    companion.last_message_at || companion.created_at
  );
  const daysSince = (now - lastInteraction) / (1000 * 60 * 60 * 24);

  return -1 * calculateDecayAmount({ curveType, daysSince, rank });
}
