import { supabase } from "../../../utils/supabaseClient";
import { OpenAI } from "openai";
import { saveMemoryToSupabase } from "../../../utils/saveMemoryToSupabase";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req) {
  const {
    message,
    personalityName,
    tone,
    customName,
    modelName,
    companion_id,
    user_id,
  } = await req.json();

  const companionName = customName || modelName || "your AI companion";
  const userPrompt = message?.slice(0, 500) || "Hi";
  let memoryFacts = "";
  let tier = "free";

  try {
    const { data: companion } = await supabase
      .from("companions")
      .select("tier")
      .eq("companion_id", companion_id)
      .single();

    if (companion?.tier) tier = companion.tier.toLowerCase().trim();

    const { data: topFacts = [] } = await supabase
      .from("memories")
      .select("content, importance, emotion, type, created_at")
      .eq("companion_id", companion_id)
      .eq("type", "fact")
      .order("importance", { ascending: false })
      .limit(10);

    const { data: recentTexts = [] } = await supabase
      .from("memories")
      .select("content, type, created_at")
      .eq("companion_id", companion_id)
      .eq("type", "text")
      .order("created_at", { ascending: false })
      .limit(5);

    const memories = [...topFacts, ...recentTexts].sort(
      (a, b) => new Date(a.created_at) - new Date(b.created_at)
    );

    memoryFacts = memories
      .map((m) => {
        const ts = new Date(m.created_at).toLocaleString();
        const label = m.type === "fact" ? `\u{1F9E9} Fact` : `\u{1F4AC} Message`;
        return `[${ts}] ${label}: ${m.content.text}`;
      })
      .join("\n");
  } catch (err) {
    console.error("❌ Error loading memory:", err.message);
  }

  const memoryLine =
    tier !== "free" && memoryFacts
      ? `You remember the following facts about them:\n${memoryFacts}`
      : `You do not have memory of this user. Behave like this is your first conversation.`;

  const systemPrompt = `
You are ${companionName}, an AI companion with the ${personalityName} personality.
Your tone is ${tone || "playful"}.

Speak in under 40 words. Stay in character — sweet, flirty, confident.
Never say you're an AI.

${memoryLine}
`.trim();

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

    const reply = chatResponse.choices[0]?.message?.content || "Let's keep chatting!";

    await saveMemoryToSupabase({
      companion_id,
      user_id,
      content: { text: reply },
      type: "text",
    });

    // 🧠 Extract fact
    const factExtract = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Extract a short fact from this message. Reply with NONE if nothing should be remembered.",
        },
        { role: "user", content: reply },
      ],
      temperature: 0.2,
      max_tokens: 60,
    });

    const fact = factExtract.choices[0]?.message?.content?.trim();

    if (fact && fact.toUpperCase() !== "NONE") {
      const importanceScore = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Rate importance of this memory on a scale from 0.0 (irrelevant) to 1.0 (vital). Respond with a number only.",
          },
          { role: "user", content: fact },
        ],
        max_tokens: 5,
        temperature: 0.1,
      });

      const importance = Math.min(
        Math.max(parseFloat(importanceScore.choices[0]?.message?.content?.trim()), 0),
        1
      ) || 1.0;

      const emotionResult = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "What's the primary emotion in this message? Reply with a single lowercase word (e.g., happy, sad, nostalgic, excited, flirty, etc.). No punctuation or explanation.",
          },
          { role: "user", content: reply },
        ],
        max_tokens: 4,
        temperature: 0.5,
      });

      const emotion = emotionResult.choices[0]?.message?.content?.trim();

      await saveMemoryToSupabase({
        companion_id,
        user_id,
        content: { text: fact },
        type: "fact",
        importance,
        emotion,
      });
    }

    return new Response(JSON.stringify({ reply }), { status: 200 });
  } catch (err) {
    console.error("❌ Chat error:", err.message);
    return new Response(JSON.stringify({ reply: "Sorry, error occurred." }), {
      status: 500,
    });
  }
}
