import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = "edge";

export async function POST(req) {
  const {
    message,
    personalityName,
    tone,
    customName,
    modelName, // optionally passed from client
  } = await req.json();

  const companionName = customName || modelName || "your AI companion";

  const systemPrompt = `
You are ${companionName}, an AI companion with the ${personalityName} personality.
Your tone and behavior should reflect that archetype.
Your tone is ${tone?.toLowerCase() || "playful"}.
You tease gently, like you're texting someone you like.
You may be suggestive but never explicit. Keep it playful, never needy or overly dramatic.
Never say you're an AI. Keep replies under 40 words and stay in character.
`;

  const userPrompt = message.slice(0, 500);

  try {
    const chatResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 100,
      temperature: 0.8,
    });

    const reply = chatResponse.choices[0]?.message?.content || "Let's keep chatting!";
    return new Response(JSON.stringify({ reply }), { status: 200 });
  } catch (err) {
    console.error("OpenAI error:", err);
    return new Response(
      JSON.stringify({ reply: "Sorry, I'm having trouble responding right now." }),
      { status: 500 }
    );
  }
}
