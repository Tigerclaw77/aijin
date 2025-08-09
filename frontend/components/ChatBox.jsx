'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';

import useAuthStore from '../store/authStore';
import useCompanionStore from '../store/companionStore';
import useChatLogic from '../hooks/useChatLogic';

import GiftPanel from './GiftPanel';
import GiftShopModal from './GiftShopModal';
import GiftToast from './GiftToast';

export default function ChatBox() {
  const { currentCompanion, selectedPersonality, setCurrentCompanion } = useCompanionStore();
  const { user } = useAuthStore();

  const [tokens, setTokens] = useState(null);

  const [activeGift, setActiveGift] = useState(null);
  const [showGifts, setShowGifts] = useState(true);
  const [showGiftShop, setShowGiftShop] = useState(false);
  const scrollAnchorRef = useRef(null);
  const giftPanelRef = useRef(null);
  const router = useRouter();

  const tier = useMemo(() => {
    const t = user?.profile?.subscription_tier?.toLowerCase();
    if (!t) return 'free';
    if (['friend', 'crush', 'girlfriend', 'waifu', 'harem'].includes(t)) {
      return t === 'friend' ? 'friend' : 'premium';
    }
    return 'free';
  }, [user]);

  const {
    messages,
    input,
    setInput,
    sendMessage,
    isTyping,
    isLoading,
    reachedLimit,
    inputDisabled,
    messagesEndRef,
    memoryEnabled,
    companionName,
    handleGiftUsed,   // from hook — we'll wrap it below
    userTier,
    isApplyingGift,
    applyingGiftId,
    questionCount,
    bonusMessages,
    giftUnlocks,
    unlimitedUntil,
    cacheKeyRef,
    fetchedCompanion,
    chatContext,
  } = useChatLogic({
    user,
    currentCompanion,
    selectedPersonality,
    setCurrentCompanion,
    setActiveGift,
    setShowGifts,
    giftPanelRef,
  });

  useEffect(() => {
    if (user?.profile?.is_admin) return;
    if (reachedLimit) {
      const timeout = setTimeout(() => {
        setShowGifts(true);
        giftPanelRef?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [reachedLimit]);

  useEffect(() => {
    if (reachedLimit && !user?.profile?.is_admin && !showGifts) {
      setShowGifts(true);
    }
  }, [reachedLimit, showGifts, user]);

  useEffect(() => {
    if (
      fetchedCompanion?.companion_id &&
      fetchedCompanion?.companion_id !== currentCompanion?.companion_id
    ) {
      setCurrentCompanion(fetchedCompanion);
    }
  }, [fetchedCompanion, currentCompanion, setCurrentCompanion]);

  useEffect(() => {
    if (scrollAnchorRef.current) {
      scrollAnchorRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, isTyping]);

  // Load starting balance from profile safely
  useEffect(() => {
    if (user?.profile?.tokens != null) {
      setTokens(user.profile.tokens);
    }
  }, [user]);

  // Wrap the hook's handler so we also update the local token HUD
  const onGiftUsedHandler = (payload) => {
    const n = Number(payload?.newBalance);
    if (Number.isFinite(n)) setTokens(n);
    handleGiftUsed?.(payload); // keep hook side-effects
  };

  const renderText = (msg) => {
    let value = msg?.text;
    let depth = 0;

    while (typeof value === 'object' && value !== null && depth < 3) {
      value = value.text ?? value.content ?? null;
      depth++;
    }

    if (value === '__MESSAGE_LIMIT_REACHED__') {
      return (
        <span>
          💬 You’ve reached your message limit{' '}
          <a href="/subscribe" className="underline text-blue-500 hover:text-blue-700">
            Upgrade to continue
          </a>
          .
        </span>
      );
    }

    if (typeof value === 'string') return value;

    console.warn('⚠️ Invalid msg.text:', msg);
    return '[Error: Invalid message content]';
  };

  if (!user || !companionName || memoryEnabled === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-400 animate-pulse">
        <div className="text-3xl">✨ Getting ready...</div>
        <div className="text-sm mt-2">Warming up your companion</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-gray-800 p-4 mt-10 rounded-xl shadow-xl max-w-2xl mx-auto min-h-[700px]">
      {/* Tiny HUD so you can see balance updates */}
      <div className="mb-2 text-right text-sm text-gray-300">
        Tokens: <span className="font-semibold">{tokens ?? '…'}</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 border border-white/10 rounded-lg p-2 bg-gray-900/40 min-h-[500px] max-h-[500px]">
        {messages.map((msg, idx) => (
          <div
            key={msg.id || idx}
            className={`flex items-start mb-3 ${
              msg.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.sender === 'ai' && currentCompanion?.avatar_image_url && (
              <div className="w-8 h-8 mr-2 rounded-full overflow-hidden border border-pink-500 shadow-sm">
                <img
                  src={currentCompanion.avatar_image_url}
                  alt="AI"
                  className="w-full h-full object-cover transition-opacity duration-300 opacity-0"
                  style={{ objectPosition: 'center -20%', transform: 'scale(1.3)' }}
                  onLoad={(e) => e.currentTarget.classList.remove('opacity-0')}
                />
              </div>
            )}
            <div
              className={`max-w-xs px-4 py-2 rounded-lg text-sm shadow-sm ${
                msg.sender === 'user'
                  ? 'bg-blue-500 text-white rounded-br-none'
                  : 'bg-white text-gray-800 rounded-bl-none'
              }`}
            >
              {(() => {
                try {
                  const rendered = renderText(msg);
                  if (
                    typeof rendered === 'string' ||
                    typeof rendered === 'number' ||
                    rendered?.type
                  ) {
                    return rendered;
                  }
                  console.warn('❌ Unrenderable renderText output:', rendered);
                  return '[Rendering error]';
                } catch (err) {
                  console.error('🚨 renderText threw error:', err);
                  return '[Fatal error rendering message]';
                }
              })()}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex items-start my-2">
            <div className="w-8 h-8 mr-2 rounded-full overflow-hidden border border-pink-500 shadow-sm">
              <img
                src={currentCompanion?.avatar_image_url}
                alt="AI"
                className="w-full h-full object-cover transition-opacity duration-300 opacity-0"
                style={{ objectPosition: 'center -20%', transform: 'scale(1.3)' }}
                onLoad={(e) => e.currentTarget.classList.remove('opacity-0')}
              />
            </div>
            <div className="max-w-xs px-4 py-2 rounded-lg text-sm shadow-sm bg-white text-gray-500 italic animate-pulse">
              typing...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
        <div ref={scrollAnchorRef} className="h-1" />
      </div>

      <div className="flex justify-end mt-3">
        <button
          onClick={() => setShowGifts((prev) => !prev)}
          className="text-sm font-semibold tracking-wide text-pink-400 hover:text-pink-200 transition-all duration-300"
        >
          {showGifts ? '🙈 Hide Gifts' : '🎁 Show Gifts'}
        </button>
      </div>

      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          showGifts
            ? 'max-h-[500px] opacity-100 mt-2 animate-fade-in-up'
            : 'max-h-0 opacity-0 animate-fade-out-down'
        }`}
      >
        <div ref={giftPanelRef}>
          <GiftPanel
            onGiftUsed={onGiftUsedHandler}   // <-- use wrapper so tokens update
            tier={userTier}
            onGiftShop={() => setShowGifts(true)}
            disabled={false}
            isApplyingGift={isApplyingGift}
            applyingGiftId={applyingGiftId}
          />
        </div>
      </div>

      {showGiftShop && <GiftShopModal onClose={() => setShowGiftShop(false)} />}

      <div className="flex mt-4 gap-2">
        <input
          type="text"
          className={`flex-1 rounded-lg border px-4 py-2 text-sm shadow-sm transition-opacity ${
            reachedLimit && !user?.profile?.is_admin ? 'opacity-60 cursor-not-allowed' : ''
          }`}
          placeholder={
            reachedLimit && !user?.profile?.is_admin
              ? 'Message limit reached — send a gift to keep going 💝'
              : 'Ask me anything...'
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          disabled={inputDisabled || isLoading || (reachedLimit && !user?.profile?.is_admin)}
        />

        <button
          onClick={sendMessage}
          className={`px-4 py-2 rounded-lg shadow ${
            inputDisabled || isLoading || reachedLimit
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
          disabled={inputDisabled || isLoading || reachedLimit}
        >
          {isLoading ? '...' : 'Send'}
        </button>
      </div>

      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-3 rounded-md bg-black/30 text-xs text-gray-300 border border-white/10 shadow-inner">
          <p><strong>Debug Info</strong></p>
          <p>Tier: {userTier}</p>
          <p>Messages Sent: {questionCount}</p>
          <p>Bonus Messages: {bonusMessages}</p>
          <p>
            Boba Unlimited Active:{' '}
            {giftUnlocks?.bobaActive === undefined ? '—' : giftUnlocks.bobaActive ? 'Yes' : 'No'}
          </p>
          <p>Unlimited Until: {unlimitedUntil?.toLocaleString() || '—'}</p>
          <p>Reached Limit: {reachedLimit ? 'Yes' : 'No'}</p>
          <p>Memory Enabled: {memoryEnabled === null ? 'Checking...' : memoryEnabled ? 'Yes' : 'No'}</p>
          <p>Companion ID: {currentCompanion?.companion_id || 'None'}</p>
          <p>Cache Key: {cacheKeyRef.current}</p>
        </div>
      )}

      {activeGift && (
        <GiftToast
          giftName={activeGift}
          userTokens={tokens ?? user?.profile?.tokens ?? 0}
          onClose={() => setActiveGift(null)}
          onBuyMore={() => router.push('/tokens')}
        />
      )}
    </div>
  );
}
