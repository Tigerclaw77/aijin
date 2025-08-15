// frontend/app/api/chat/send/route.js
// Chat with persistence + durable memories (minimal, no extras).
// - Saves user + assistant messages to Supabase
// - Loads recent chat history into the prompt (short‑term memory)
// - Loads durable memories (facts) into the prompt (long‑term memory)
// - Extracts 0–3 new durable facts per turn and saves them
// - Keeps reply snappy; your UI already handles “typing” delays

import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { supabaseServer as supabase } from '../../../../utils/Supabase/supabaseServerClient';

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

// -----------------------------
// Utilities
// -----------------------------
function pick(obj, ...keys) {
  for (const k of keys) if (obj && obj[k] != null) return obj[k];
  return null;
}

function fmtHistory(history) {
  // history: [{ role: 'user'|'assistant', content: '...' }]
  // keep it compact; oldest → newest
  return history.map(m => `${m.role === 'assistant' ? 'AI' : 'User'}: ${m.content}`).join('\n');
}

// -----------------------------
// DB helpers (tolerant of missing tables)
// -----------------------------
async function saveMessage({ userId, companionId, role, content }) {
  try {
    await supabase.from('messages').insert({
      user_id: userId,
      companion_id: companionId,
      role,
      content,
    });
  } catch {
    // ignore
  }
}

async function loadRecentMessages(userId, companionId, limit = 24) {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('role, content, created_at')
      .eq('user_id', userId)
      .eq('companion_id', companionId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) return [];
    return (data || []).reverse(); // oldest → newest
  } catch {
    return [];
  }
}

async function loadTopMemories(userId, companionId, limit = 12) {
  try {
    const { data, error } = await supabase
      .from('memories')
      .select('content, importance')
      .eq('user_id', userId)
      .eq('companion_id', companionId)
      .order('importance', { ascending: false })
      .limit(limit);
    if (error) return [];
    return (data || []).map(m => (typeof m.content === 'string' ? m.content : JSON.stringify(m.content ?? {})));
  } catch {
    return [];
  }
}

async function saveMemories(userId, companionId, facts = []) {
  if (!facts?.length) return;
  const rows = facts.slice(0, 3).map(f => ({
    user_id: userId,
    companion_id: companionId,
    content: typeof f === 'string' ? f : f.text || JSON.stringify(f),
    importance: Number.isFinite(f?.importance) ? f.importance : 0.7,
  }));
  try {
    await supabase.from('memories').insert(rows);
  } catch {
    // ignore
  }
}

// -----------------------------
// Memory extraction (minimal)
// -----------------------------
async function extractDurableFacts({ historyText, latestUser, assistantReply }) {
  if (!openai) return [];
  const userPrompt = `From the chat context and latest turn, extract 0-3 DURABLE facts about the USER or RELATIONSHIP that will still matter months later.
Examples: names, relationship status, important trips (e.g., "we went to Hawaii"), stable preferences. 
Exclude trivial/time-specific/explicit details.
Output JSON array like: [{"text":"...", "importance":0.0-1.0}]. Return [] if none.

CHAT CONTEXT:
${historyText}

LATEST USER:
${latestUser}

ASSISTANT:
${assistantReply}`;

  try {
    const r = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Extract durable facts. Output JSON only.' },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 220,
    });
    const txt = r?.choices?.[0]?.message?.content?.trim() || '[]';
    try {
      const json = JSON.parse(txt);
      return Array.isArray(json) ? json.slice(0, 3) : [];
    } catch {
      return [];
    }
  } catch {
    return [];
  }
}

// -----------------------------
// Route
// -----------------------------
export async function POST(req) {
  try {
    const body = await req.json();

    const userId = pick(body, 'user_id', 'userId');
    const companionId = pick(body, 'companion_id', 'companionId');
    if (!userId || !companionId) {
      return NextResponse.json({ error: 'missing_ids' }, { status: 400 });
    }

    const userMsg = (pick(body, 'message', 'text') || 'Hi').toString().slice(0, 2000);
    const companionName = pick(body, 'customName') || pick(body, 'modelName', 'model_id') || 'your AI companion';
    const personalityName = pick(body, 'personalityName') || 'Default';
    const tone = pick(body, 'tone') || 'Warm & attentive';

    // 1) Save user message
    await saveMessage({ userId, companionId, role: 'user', content: userMsg });

    // 2) Load short-term history + long-term memories
    const history = await loadRecentMessages(userId, companionId, 24);
    const historyText = fmtHistory(history);
    const memoryFacts = await loadTopMemories(userId, companionId, 12);
    const memoryBlock = memoryFacts.length
      ? `Durable facts (top):\n- ${memoryFacts.join('\n- ')}`
      : 'No durable facts stored yet.';

    // 3) Build prompt
    const systemMsg = `You are ${companionName}, personality=${personalityName}, tone=${tone}.
Stay supportive and engaging. Avoid explicit content. Use relevant memories. Be concise but warm.`;
    const userBlock = `Recent chat:\n${historyText || '(none)'}\n\n${memoryBlock}\n\nUser: ${userMsg}`;

    // 4) Get assistant reply
    let reply = 'I’m here—tell me more. 🙂';
    if (openai) {
      try {
        const r = await openai.chat.completions.create({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemMsg },
            { role: 'user', content: userBlock },
          ],
          temperature: 0.8,
          max_tokens: 240,
        });
        reply = r?.choices?.[0]?.message?.content?.trim() || reply;
      } catch {
        // keep fallback
      }
    }

    // 5) Save assistant reply
    await saveMessage({ userId, companionId, role: 'assistant', content: reply });

    // 6) Extract & persist 0–3 durable facts (best-effort, non-blocking feel)
    try {
      const facts = await extractDurableFacts({ historyText, latestUser: userMsg, assistantReply: reply });
      await saveMemories(userId, companionId, facts);
    } catch {
      // ignore
    }

    return NextResponse.json({
      reply,
      moodGreeting: null,
      memoryFacts, // surfaced so UI can reflect "what I remembered"
      verbalLevel: 1,
      physicalLevel: 1,
      subscriptionTier: 'free', // keep simple; your UI already handles tier caps
    });
  } catch {
    return NextResponse.json({ error: 'send_error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, endpoint: 'chat/send' });
}
