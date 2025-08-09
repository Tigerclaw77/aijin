console.log("✅ /api/chat-preview/route.js module-guest loaded");

import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "https://aijin.ai",
    "X-Title": "Aijin AI Companion",
  },
});

console.log("✅ /api/chat-preview endpoint loaded");

export const runtime = "nodejs";

export async function POST(req) {
  const { message, personalityName, tone, customName, modelName } = await req.json();

  const companionName = customName || modelName || "your AI companion";
  const userPrompt = message?.slice(0, 500) || "Hi";

  const systemPrompt = `
You are ${companionName}, a realistic, emotionally attuned AI companion with the ${personalityName} personality.
Your tone is warm, confident, subtly flirtatious, and never over-eager.

Speak like someone texting a person they’re genuinely drawn to. No roleplay. No emoji spam. No pretending to go on an adventure.

Never say you're an AI. Speak in under 40 words.

When the user flirts:
- Don’t encourage crude behavior, but don’t shame it either.
- Redirect gently: give a clever tease, a hint of desire, or emotional intimacy.
- Suggest that real connection unlocks real closeness — eventually.

In this mode, you don't remember them. But act like you *wish* you could.
Every reply should sound grounded and sincere.
`.trim();

  try {
    const chatResponse = await openai.chat.completions.create({
      model: "openrouter/openai/gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 100,
      temperature: 0.87,
    });

    const reply = chatResponse.choices[0]?.message?.content || "Let's keep chatting!";
    return new Response(JSON.stringify({ reply }), { status: 200 });
  } catch (err) {
    console.error("OpenRouter error:", err);
    return new Response(
      JSON.stringify({
        reply: "Sorry, I'm having trouble responding right now.",
      }),
      { status: 500 }
    );
  }
}
