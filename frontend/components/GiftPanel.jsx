'use client';

import { useEffect, useMemo, useState } from 'react';
import useCompanionStore from '../store/companionStore';
// no aliasing; adjust if your file lives elsewhere
import { purchaseGift } from '../utils/Chat-Gifts/purchaseGifts';

export default function GiftPanel({
  onGiftUsed,
  tier = 'free',
  disabled = false,
  isApplyingGift = false,
  applyingGiftId = null,
}) {
  const { currentCompanion } = useCompanionStore();
  const companion_id = currentCompanion?.id || currentCompanion?.companion_id || null;

  const [toast, setToast] = useState(null);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(id);
  }, [toast]);

  const [busy, setBusy] = useState(false);
  const [pendingId, setPendingId] = useState(null);

  // Base drink gifts shown in chat (IDs double as giftKey for the API)
  const baseGifts = useMemo(
    () => [
      {
        id: 'tea',
        name: 'Tea',
        baseCost: 100,
        emoji: '🍵',
        desc: '+10 messages',
        effect: { extraMessages: 10 },
      },
      {
        id: 'coffee',
        name: 'Coffee',
        baseCost: 200,
        emoji: '☕',
        desc: '+25 messages',
        effect: { extraMessages: 25 },
      },
      {
        id: 'boba',
        name: 'Boba',
        baseCost: 300,
        emoji: '🧋',
        desc: 'Unlimited chat for 12h',
        effect: { unlimited: 12 }, // hours
      },
      {
        id: 'energy_drink',
        name: 'Energy Drink',
        baseCost: 400,
        emoji: '🥤',
        desc: 'Unlimited chat for 24h',
        effect: { unlimited: 24 }, // hours
      },
    ],
    []
  );

  // Discounts: 25% off for Girlfriend, 50% off for Waifu
  function getDrinkDiscountMultiplier(t) {
    const norm = (t || '').toLowerCase();
    if (norm === 'girlfriend') return 0.75;
    if (norm === 'waifu') return 0.5;
    return 1.0;
  }
  const discount = getDrinkDiscountMultiplier(tier);

  const gifts = useMemo(
    () => baseGifts.map((g) => ({ ...g, price: Math.max(0, Math.round(g.baseCost * discount)) })),
    [baseGifts, discount]
  );

  async function buyGift(gift) {
    if (busy) return;
    if (!companion_id) {
      setToast({ type: 'error', text: 'No companion selected.' });
      return;
    }

    setBusy(true);
    setPendingId(gift.id);

    try {
      // Call your client helper which POSTs to /api/gifts/purchase
      // IMPORTANT: send gift.id as giftKey so the server can resolve it
      const data = await purchaseGift(companion_id, gift.id);

      // Expecting shape from the API: { ok, code, charged, discount_percent, purchase_id, effects_applied }
      if (!data?.ok) {
        const code = data?.code || 'SERVER_ERROR';
        throw Object.assign(new Error(code), { code, serverMessage: data?.message });
      }

      const charged = data?.charged ?? gift.price;
      const appliedTier =
        typeof data?.discount_percent === 'number' && data.discount_percent > 0 ? tier : (tier || 'free');

      setToast({
        type: 'success',
        text: `${gift.id} activated (−${charged} tokens${appliedTier ? `, tier: ${appliedTier}` : ''}).`,
      });

      onGiftUsed?.({
        id: gift.id,
        name: gift.id,
        uiPrice: gift.price,         // UI-displayed price after client-side discount
        finalUnitPrice: charged,     // actual tokens charged by the server
        appliedTier,                 // tier used by the server for discount
        effect: gift.effect,         // local effect descriptor for UI logic
        newBalance: data?.newBalance ?? null, // optional if your API returns it
        companion_id,
        purchase_id: data?.purchase_id ?? null,
      });
    } catch (e) {
      const code = e?.code || String(e?.message || 'SERVER_ERROR');
      const serverMsg = e?.serverMessage;

      const map = {
        UNAUTHENTICATED: 'Please sign in first.',
        BAD_REQUEST: 'Bad request — refresh and try again.',
        GIFT_NOT_FOUND: 'That gift is unavailable.',
        INSUFFICIENT_FUNDS: 'Not enough tokens.',
        BALANCE_UPDATE_FAILED: 'Couldn’t charge tokens.',
        PURCHASE_LOG_FAILED: 'Couldn’t record purchase.',
        PROFILE_ERROR: 'Couldn’t load your profile.',
        SERVER_ERROR: 'Server error. Try again.',
        // legacy/local keys (if your helper throws strings)
        UNKNOWN_GIFT: 'Unknown gift selected.',
        GIFT_UNAVAILABLE: 'This gift isn’t available.',
        INSUFFICIENT_TOKENS: 'Not enough tokens.',
      };

      setToast({ type: 'error', text: map[code] || serverMsg || 'Purchase failed. Try again.' });
      console.error('Gift purchase failed:', code, serverMsg || e);
    } finally {
      setTimeout(() => {
        setBusy(false);
        setPendingId(null);
      }, 400);
    }
  }

  return (
    <div className="flex flex-col gap-3 items-stretch">
      <div className="flex flex-1 gap-3 min-w-0">
        {gifts.map((gift) => {
          const isThisApplying =
            (isApplyingGift && applyingGiftId === gift.id) || pendingId === gift.id;
          const btnDisabled = disabled || busy || isThisApplying;

          return (
            <div
              key={gift.id}
              className="flex flex-col justify-between flex-1 rounded-lg p-3 text-center shadow-md border bg-white"
            >
              <div className="text-3xl mb-1">{gift.emoji}</div>
              <div className="font-semibold text-gray-700">{gift.id}</div>
              <div className="text-xs text-gray-500">{gift.desc}</div>
              <div className="mt-auto pt-2">
                <button
                  className={`w-full text-xs px-3 py-1.5 rounded bg-pink-500 text-white transition ${
                    btnDisabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-pink-600'
                  }`}
                  onClick={() => buyGift(gift)}
                  disabled={btnDisabled}
                  aria-busy={isThisApplying}
                >
                  {isThisApplying ? 'Processing…' : `🪙 ${gift.price}`}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Long but unobtrusive "More Gifts" button along the bottom */}
      <button
        type="button"
        className="w-full mt-1 text-xs px-3 py-2 rounded bg-purple-600 text-white hover:bg-purple-700 transition disabled:opacity-40"
        onClick={() => {
          if (typeof window !== 'undefined') {
            const ev = new CustomEvent('open-gift-shop');
            window.dispatchEvent(ev);
          }
          setToast({ type: 'info', text: 'Gift shop coming soon.' });
        }}
        disabled={disabled || busy}
      >
        🛍️ More Gifts
      </button>

      {toast && (
        <div
          role="status"
          className={`fixed bottom-4 right-4 px-4 py-3 rounded-xl shadow-lg text-white
            ${
              toast.type === 'success'
                ? 'bg-green-600/90'
                : toast.type === 'info'
                  ? 'bg-slate-700/90'
                  : 'bg-red-600/90'
            }`}
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}
