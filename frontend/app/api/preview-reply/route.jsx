// app/api/preview-reply/route.js
// Minimal API that returns one short Rika reply per request.

export async function POST(req) {
  try {
    const { userText, turn } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: "Missing OPENAI_API_KEY" }), { status: 500 });
    }

    // Persona + guardrails (mildly flirty, taken, wingwoman)
    const system = `
You are Rika. You're taken and explicitly act as a friendly wingwoman.
Tone: warm, playful, mildly flirtatious but respectful. Keep replies concise (1–2 sentences).
Nudge that your friends are interested and you're offering to introduce them.
Never be explicit or crude. No disclaimers or meta AI talk. No emojis unless user uses them.
If turn is 3, make it feel like a natural handoff to a signup (no link text — client adds CTA).
`;

    const body = {
      model: "gpt-4o-mini", // choose your model
      temperature: 0.8,
      max_tokens: 90,
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: `Turn: ${turn}\nUser: "${userText}"`
        }
      ]
    };

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify(body)
    });

    if (!r.ok) {
      const err = await r.text().catch(() => "");
      return new Response(JSON.stringify({ error: err || "Upstream error" }), { status: 502 });
    }

    const data = await r.json();
    const text = data?.choices?.[0]?.message?.content?.trim?.() || "";

    return new Response(JSON.stringify({ text }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Unexpected error" }), { status: 500 });
  }
}
