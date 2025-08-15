// frontend/app/api/chat/preview/route.js

import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

export async function POST(req) {
  try {
    const body = await req.json();
    const message = (body?.message || body?.text || 'Hi').toString().slice(0, 1000);
    const companionName = body?.customName || body?.modelName || body?.model_id || 'your AI companion';
    const personalityName = body?.personalityName || 'Miyu';
    const tone = body?.tone || 'Sweet & playful';

    let reply = 'Hi! I’m happy to chat. What’s on your mind?';
    if (openai) {
      try {
        const r = await openai.chat.completions.create({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          messages: [
            { role: 'system', content: `You are ${companionName}, personality=${personalityName}, tone=${tone}. Keep replies short and friendly.` },
            { role: 'user', content: message },
          ],
          temperature: 0.8,
          max_tokens: 180,
        });
        reply = r?.choices?.[0]?.message?.content?.trim() || reply;
      } catch {}
    }

    return NextResponse.json({
      reply,
      moodGreeting: null,
      memoryFacts: [],
      verbalLevel: 1,
      physicalLevel: 1,
      subscriptionTier: 'free',
    });
  } catch {
    return NextResponse.json({ reply: 'Hey! Tell me something about you. 🙂' });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, endpoint: 'chat/preview' });
}
