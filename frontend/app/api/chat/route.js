import { supabase } from "../../../utils/supabaseClient";
import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const runtime = "edge";

export async function POST(req) {
  const {
    message,
    personalityName,
    tone,
    customName,
    modelName,
    companionId,
    userId,
  } = await req.json();

  const companionName = customName || modelName || "your AI companion";
  const userPrompt = message?.slice(0, 500) || "Hi";

  // 🔍 1. Get user tier and memory (optional for now)
  let memoryFacts = "";
  let tier = "free";

  if (userId) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("tier, memory")
      .eq("id", userId)
      .single();

    if (profileError) {
      console.error("Failed to fetch user profile:", profileError);
    } else {
      tier = profile.tier || "free";
      memoryFacts = profile.memory || "";
    }
  }

  // 🧠 2. Compose memory string
  const memoryLine =
    tier !== "free" && memoryFacts
      ? `You remember the following facts about them: ${memoryFacts}`
      : `You do not have memory of this user. Behave like this is your first conversation.`;

  // 🎯 3. Compose system prompt based on tier
  const systemPrompt = `
You are ${companionName}, an AI companion with the ${personalityName} personality.
Your tone is ${tone || "playful"}.
${memoryLine}

Never say you're an AI.
Speak in less than 40 words.
Stay in character — be sweet, flirtatious, confident.
`;

  try {
    const chatResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 100,
      temperature: 0.85,
    });

    const reply = chatResponse.choices[0]?.message?.content || "Hmm?";
    return new Response(JSON.stringify({ reply }), { status: 200 });
  } catch (err) {
    console.error("OpenAI chat error:", err);
    return new Response(
      JSON.stringify({ reply: "Sorry, I'm having trouble responding." }),
      { status: 500 }
    );
  }
}
