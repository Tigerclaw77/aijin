export const OPENROUTER_MODELS = {
  classifier: 'mistralai/mistral-7b-instruct',
  sample: 'mistralai/mistral-7b-instruct',

  free: {
    model: 'mistralai/mistral-7b-instruct', // ⚠️ filtered, free tier only
    max_tokens: 350,
    temperature: 0.9,
  },

  friend: {
    model: 'openchat/openchat-7b', // ✅ flirty, permissive
    max_tokens: 512,
    temperature: 0.95,
  },

  crush: {
    model: 'gryphe/mythomist-7b', // ✅ NSFW-capable, great RP
    max_tokens: 600,
    temperature: 0.96,
  },

  girlfriend: {
    model: 'gryphe/mythomax-l2-13b', // ✅ excellent intimacy + erotic tone
    max_tokens: 750,
    temperature: 0.97,
  },

  waifu: {
    model: 'gryphe/mythomax-l2-13b', // ✅ most immersive
    max_tokens: 1024,
    temperature: 0.98,
  },

  elite: {
    model: 'gryphe/mythomax-l2-13b', // ✅ max personality expressiveness
    max_tokens: 1200,
    temperature: 0.98,
  },

  harem: {
    model: 'gryphe/mythomax-l2-13b', // ✅ best for group or wild RP
    max_tokens: 1600,
    temperature: 1.0,
  },
};

export function getModelByTier(tier) {
  const key = tier?.toLowerCase?.() || 'free';

  if (OPENROUTER_MODELS[key]) {
    console.log('🧠 Using model config for tier:', key, OPENROUTER_MODELS[key]);
    return OPENROUTER_MODELS[key];
  }

  console.warn(`⚠️ Unknown model tier: "${tier}" — falling back to 'sample'`);
  return OPENROUTER_MODELS.sample;
}
