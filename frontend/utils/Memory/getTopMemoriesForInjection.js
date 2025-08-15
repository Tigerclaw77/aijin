import { supabaseServer } from '../../../utils/Supabase/supabaseServerClient';

const emotionWeights = {
  love: 0.5,
  longing: 0.4,
  sad: 0.3,
  angry: 0.3,
  happy: 0.1,
  // everything else: 0
};

export async function getTopMemoriesForInjection(user_id, companion_id, limit = 10) {
  const { data, error } = await supabaseServer
    .from('memories')
    .select('message_id, content, created_at, emotion')
    .eq('user_id', user_id)
    .eq('companion_id', companion_id)
    .not('content', 'is', null);

  if (error) {
    console.error('⚠️ Error fetching memories:', error.message);
    return [];
  }

  const now = Date.now();

  const scored = data.map((mem) => {
    const daysOld = (now - new Date(mem.created_at).getTime()) / (1000 * 60 * 60 * 24);
    const recencyScore = 1 / (daysOld + 1);
    const emotionScore = emotionWeights[mem.emotion_tag] || 0;
    const totalScore = recencyScore + emotionScore;

    return {
      ...mem,
      score: totalScore,
    };
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}
