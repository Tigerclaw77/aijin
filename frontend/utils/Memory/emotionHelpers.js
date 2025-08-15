// /utils/Memory/emotionHelpers.js
import { supabaseServer } from '../../../utils/Supabase/supabaseServerClient';

/**
 * Fetch the most recent memory with an emotion tag
 * @param {string} user_id
 * @param {string} companion_id
 * @returns {Promise<string|null>} e.g., "happy", "sad", or null
 */
export async function getRecentEmotionTag(user_id, companion_id) {
  const { data, error } = await supabaseServer
    .from('memories')
    .select('emotion, created_at')
    .eq('user_id', user_id)
    .eq('companion_id', companion_id)
    .not('emotion', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('⚠️ getRecentEmotionTag failed:', error.message);
    return null;
  }

  return data?.[0]?.emotion || null;
}
