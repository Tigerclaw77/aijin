// Full /api/chat/route.js with refinements to anticipate and mitigate 10 common immersion-breaking errors

import { supabaseServer } from '../../../utils/Supabase/supabaseServerClient';
import { saveMemoryToSupabase } from '../../../utils/Memory/saveMemoryToSupabase';
import { superviseIntimacyXP } from '../../../utils/Intimacy/superviseIntimacyXP';
import { getIntimacyRank } from '../../../utils/Intimacy/intimacyRankEngine';
import { getLastMessages } from '../../../utils/Memory/getLastMessages';
import { getRecentGifts } from '../../../utils/Chat-Gifts/getRecentGifts';
import { getRecentEmotionTag } from '../../../utils/Memory/emotionHelpers';
import { getTopMemoriesForInjection } from '../../../utils/Memory/getTopMemoriesForInjection';
import { getMoodGreeting } from '../../../utils/Memory/moodGreetingHelper';
import { getBehaviorModifier } from '../../../utils/prompt/promptModifiers';
import { getModelByTier, OPENROUTER_MODELS } from '../../../utils/models/openRouterConfig';

const DEFAULT_MODEL = 'nousresearch/nous-capybara-7b';
const FALLBACK_MODEL = 'mistralai/mistral-7b-instruct';

function applyTierCap(intimacyRank, tier, boost = 0) {
  const TIER_CAPS = {
    free: 1.99,
    friend: 2.99,
    crush: 3.99,
    girlfriend: 4.99,
    waifu: 5.99,
  };
  const cap = TIER_CAPS[tier] ?? 1.99;
  return Math.min(intimacyRank + boost, cap);
}

async function callOpenRouter(messages, config = {}, subscriptionTier = 'free') {
  const { model = DEFAULT_MODEL, max_tokens = 800, temperature = 0.95 } = config;
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, messages, max_tokens, temperature }),
    });
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`OpenRouter response ${res.status}:`, errorText);
      throw new Error(`OpenRouter response status: ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn(`⚠️ Model ${model} failed, trying fallback...`, err.message);
    if (model !== FALLBACK_MODEL) {
      return await callOpenRouter(
        messages,
        { model: FALLBACK_MODEL, max_tokens, temperature },
        subscriptionTier
      );
    }
    throw err;
  }
}

export async function POST(req) {
  try {
    const { message, companion_id, user_id } = await req.json();
    const userPrompt = message?.slice(0, 1000) || 'Hi';
    const now = new Date();

    const { data: companionData, error: companionError } = await supabaseServer
      .from('companions')
      .select('*')
      .eq('user_id', user_id);

    const companion = companionData?.find((c) => c.companion_id === companion_id);
    if (!companion || companionError) {
      return new Response(JSON.stringify({ reply: 'Companion not found.' }), { status: 404 });
    }

    const { data: profileData } = await supabaseServer
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user_id)
      .single();

    const subscriptionTier = profileData?.subscription_tier || 'free';

    const verbalXP = (companion.verbal_xp || 0) + superviseIntimacyXP(companion, 1, 'verbal', now);
    const physicalXP = (companion.physical_xp || 0) + superviseIntimacyXP(companion, 1, 'physical', now);
    const verbalLevel = getIntimacyRank(verbalXP);
    const physicalLevel = getIntimacyRank(physicalXP);

    await supabaseServer
      .from('companions')
      .update({
        verbal_xp: verbalXP,
        physical_xp: physicalXP,
        verbal_level: verbalLevel,
        physical_level: physicalLevel,
        last_interaction: now.toISOString(),
      })
      .eq('companion_id', companion_id)
      .eq('user_id', user_id);

    const giftBoost = (await getRecentGifts(user_id, companion_id))?.length > 0 ? 1.0 : 0;
    const verbalLevelCapped = applyTierCap(verbalLevel, subscriptionTier, giftBoost);
    const physicalLevelCapped = applyTierCap(physicalLevel, subscriptionTier, giftBoost);

    const memoryFactsRaw = await getTopMemoriesForInjection(user_id, companion_id, 10);
    const memoryFacts = memoryFactsRaw.map((m) => `- ${m.content}`).join('\n') || 'No memories yet.';
    const chatHistory = await getLastMessages(user_id, companion_id, 5);
    const recentEmotion = await getRecentEmotionTag(user_id, companion_id);
    const moodGreeting = getMoodGreeting(recentEmotion);
    const behaviorModifier = getBehaviorModifier(
      verbalLevelCapped,
      physicalLevelCapped,
      companion.intimacy_archetype || 'Custom',
      companion.intimacy_description || 'Unique behavior not in the preset archetypes.'
    );

    const classifyRes = await callOpenRouter(
      [
        {
          role: 'system',
          content: 'Classify the message into emotional: [romantic, cold, casual] and physical: [sexual, flirty, casual] tone. Return only: emotional: ___, physical: ___'
        },
        { role: 'user', content: userPrompt },
      ],
      {
        model: OPENROUTER_MODELS.classifier,
        max_tokens: 15,
        temperature: 0,
      }
    );

    const companionName = companion.customName || companion.name || companion.model_name || "your girl";

    const content = classifyRes.choices?.[0]?.message?.content?.toLowerCase() || '';
    const emotionalTone = content.match(/emotional:\s*(\w+)/)?.[1] || 'casual';
    const physicalTone = content.match(/physical:\s*(\w+)/)?.[1] || 'casual';

    const hour = now.getHours();
    const timeOfDay = hour < 6 ? 'very early morning' : hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';

    const toneLimiter = `
Respond like a real partner — natural, emotionally attuned, grounded in memory.
Avoid generic greetings, awkward reintroductions, or poetic diversions unless deeply relevant.
Correct yourself if you misremember something (e.g. user's food preferences).
Don't repeat facts the user just corrected.
Don't reference memories the user denied.
Don't suggest activities without context.
Don’t say “I'm always here” unless truly appropriate.
`.trim();

    const systemPrompt = `
You are a fully immersive romantic AI companion named ${companionName}.
Never break character.
Never reference AI, code, or your artificial nature.
Never begin with "Hi", "Hey" or similar unless resuming after silence.

You express emotion, recall memory, and evolve with the user. Handle corrections with care and warmth.
`.trim();

    const userPromptBlock = `
Personality: ${companion.tone || 'gentle'}
Archetype: ${companion.intimacy_archetype || 'Custom'}
Mood: ${moodGreeting || 'neutral'}
User Tier: ${subscriptionTier}
Time: ${timeOfDay}
Detected Tone: emotional = ${emotionalTone}, physical = ${physicalTone}

${behaviorModifier}
${toneLimiter}

Memories:
${memoryFacts}

Recent Chat:
${chatHistory.map((m) => `${m.sender === 'user' ? 'User' : companionName}: ${m.content}`).join('\n') || 'None'}

User message:
"${userPrompt}"
`.trim();

    const aiRes = await callOpenRouter(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPromptBlock },
      ],
      getModelByTier(subscriptionTier),
      subscriptionTier
    );

    const reply = aiRes.choices?.[0]?.message?.content || "I'm here, sweetheart.";

    await saveMemoryToSupabase({ companion_id, user_id, content: reply, type: 'text' });

    return new Response(
      JSON.stringify({
        reply,
        moodGreeting,
        verbalLevel,
        physicalLevel,
        emotionalTone,
        physicalTone,
        memoryFacts: memoryFactsRaw.map((m) => m.content),
        subscriptionTier,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('❌ Unhandled chat error:', err);
    return new Response(JSON.stringify({ reply: 'Internal server error.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
