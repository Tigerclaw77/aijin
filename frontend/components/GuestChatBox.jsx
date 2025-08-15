'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { models } from '../data/models';

// ---------- pick Rika (fallback if missing) ----------
function getHostess() {
  const rika = models.find((m) => (m.name || '').toLowerCase() === 'rika');
  return (
    rika || {
      id: 'hostess-rika',
      name: 'Rika',
      image: '/images/rika.png',
      label: 'hostess',
    }
  );
}

// ---------- tiny helpers ----------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const vary = (base, spread = 280) =>
  Math.max(80, Math.round(base + (Math.random() - 0.5) * spread));

export default function GuestChatBox() {
  const router = useRouter();
  const hostess = useMemo(() => getHostess(), []);

  const [messages, setMessages] = useState([
    {
      id: 'hello',
      sender: 'ai',
      text:
        'Welcome to Aijin! I’m Rika — your guide. Say hi and try a quick 5‑message preview. No account needed.',
    },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [typing, setTyping] = useState(false);
  const [showCTA, setShowCTA] = useState(false); // ✅ moved inside component

  const maxTurns = 5; // <-- raised to 5
  const userTurns = messages.filter((m) => m.sender === 'user').length;

  // internal scroll only (prevents page jump)
  const listRef = useRef(null);
  const toBottom = () => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  };
  useEffect(() => {
    toBottom();
  }, [messages, typing]);

  // util push
  function push(sender, text) {
    setMessages((prev) => [
      ...prev,
      {
        id: `${sender}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        sender,
        text,
      },
    ]);
  }

  async function sendToPreviewAPI(userText) {
    const res = await fetch('/api/chat-preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userText,
        personalityName: 'Rika',
        customName: hostess.name || 'Rika',
        modelName: 'rika_preview',
      }),
      cache: 'no-store',
    });

    try {
      const data = await res.json();
      return data?.reply || 'Sorry, I’m having trouble responding right now. Try one more message?';
    } catch {
      return 'Hmm—network hiccup on my end. Mind trying again?';
    }
  }

  async function handleSend() {
    const text = input.trim();
    const turnsNow = messages.filter((m) => m.sender === 'user').length;
    if (!text || busy || turnsNow >= maxTurns) return;

    setBusy(true);
    setInput('');
    push('user', text);

    // kick off request immediately
    const fetchPromise = sendToPreviewAPI(text);

    // hard 2.5s pre-type delay for realism
    await sleep(2500);
    setTyping(true);

    const reply = await fetchPromise;

    // brief type-out time proportional to length
    const typeMs = Math.min(1400, Math.max(650, reply.length * 14));
    await sleep(typeMs);

    setTyping(false);
    push('ai', reply);

    const nextTurns = turnsNow + 1;

    // ---- CTA sequence when limit reached ----
    if (nextTurns >= maxTurns) {
      setShowCTA(false); // ensure hidden during CTA typing
      setTyping(true);   // keep buttons hidden
      const closer =
        'That’s the end of the preview ✨ Want to keep going? Create your companion to continue, or sign in if you already have one.';
      const closerTypeMs = Math.min(1500, Math.max(700, closer.length * 12));
      await sleep(closerTypeMs);
      setTyping(false);
      push('ai', closer);
      await sleep(120);  // tiny settle delay
      setShowCTA(true);  // reveal buttons (will fade in)
    }

    setBusy(false);
  }

  return (
    <div className="min-h-[80vh] bg-gray-100 dark:bg-gray-900 flex flex-col items-center py-6 px-4">
      <div className="w-full max-w-2xl rounded-2xl bg-slate-800/80 ring-1 ring-slate-700 shadow-xl overflow-hidden">
        {/* Header (version tag so you know it’s live) */}
        <div className="flex items-center gap-3 px-4 py-3 bg-slate-900/70">
          <img
            src={hostess.image}
            alt={hostess.name}
            className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-600"
            style={{ objectPosition: 'center 0%', transform: 'scale(1.3)' }}
          />
          <div className="flex-1">
            <div className="text-slate-100 font-semibold">{hostess.name} (Preview vLIVE5.3)</div>
            <div className="text-slate-400 text-xs">5‑message demo • no account required</div>
          </div>
        </div>

        {/* Messages list */}
        <div ref={listRef} className="px-4 py-4 space-y-3 h-[56vh] overflow-y-auto scroll-smooth">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.sender === 'ai' ? 'justify-start' : 'justify-end'}`}>
              {m.sender === 'ai' && (
                <img
                  src={hostess.image}
                  alt="Rika"
                  className="w-7 h-7 rounded-full object-cover mr-2 mt-1 ring-1 ring-slate-600 flex-shrink-0"
                  style={{ objectPosition: 'center 0%', transform: 'scale(1.0)' }}
                />
              )}
              <div
                className={`rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap max-w-[80%] ${
                  m.sender === 'ai' ? 'bg-slate-700 text-slate-100' : 'bg-pink-600 text-white'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}

          {/* Typing bubble */}
          {typing && (
            <div className="flex justify-start items-center gap-2">
              <img
                src={hostess.image}
                alt="typing"
                className="w-7 h-7 rounded-full object-cover mr-2 mt-1 ring-1 ring-slate-600 flex-shrink-0"
              />
              <div className="bg-slate-700 text-slate-200 rounded-2xl px-3 py-2 text-sm">
                <span className="inline-flex gap-1">
                  <span className="animate-pulse">●</span>
                  <span className="animate-pulse [animation-delay:120ms]">●</span>
                  <span className="animate-pulse [animation-delay:240ms]">●</span>
                </span>
              </div>
            </div>
          )}

          {/* CTA after cap (animated fade-up) */}
          {userTurns >= maxTurns && !typing && (
            <div
              className={
                `mt-3 flex flex-wrap gap-2 transition-all duration-300 ease-out ` +
                (showCTA
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 -translate-y-1 pointer-events-none')
              }
            >
              <button
                onClick={() => router.push('/create')}
                className="rounded-xl px-3 py-2 text-sm font-semibold bg-pink-600 hover:bg-pink-500 text-white"
              >
                Create your companion
              </button>
              <button
                onClick={() => router.push('/register')}
                className="rounded-xl px-3 py-2 text-sm font-semibold bg-slate-700 hover:bg-slate-600 text-white"
              >
                Sign in
              </button>
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="px-4 pb-4">
          <div className="flex gap-2">
            <input
              type="text"
              className="flex-1 rounded-xl bg-slate-900/70 text-slate-100 placeholder-slate-400 px-3 py-2 outline-none ring-1 ring-slate-700"
              placeholder={
                userTurns >= maxTurns
                  ? 'Preview ended — create or sign in to continue'
                  : 'Say hi to Rika…'
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={busy || userTurns >= maxTurns}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button
              onClick={handleSend}
              disabled={busy || userTurns >= maxTurns}
              className="rounded-xl px-4 py-2 text-sm font-semibold bg-pink-600 hover:bg-pink-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Free preview: {Math.max(0, maxTurns - userTurns)} message
            {maxTurns - userTurns === 1 ? '' : 's'} left
          </div>
        </div>
      </div>

      <div className="text-slate-400 text-xs mt-3">
        Premium companions and photos unlock after signup.
      </div>
    </div>
  );
}
