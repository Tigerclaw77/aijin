"use client";

import { useState } from "react";
import useAuthStore from "../../store/authStore";

const tokenPacks = [
  { id: "small", label: "Small", price: 1, tokens: 80, bonus: 0 },
  { id: "standard", label: "Standard", price: 5, tokens: 400, bonus: 0.05 },
  { id: "large", label: "Large", price: 10, tokens: 800, bonus: 0.1 },
  { id: "deluxe", label: "Deluxe", price: 25, tokens: 2000, bonus: 0.15 },
  { id: "ultimate", label: "Ultimate", price: 50, tokens: 4000, bonus: 0.2 },
  { id: "infinity", label: "Infinity Pack", price: 100, tokens: 8000, bonus: 0.25 },
];

export default function TokensPage() {
  const { user } = useAuthStore();
  const [selectedPack, setSelectedPack] = useState(null);

  const handlePurchase = (pack) => {
    setSelectedPack(pack);
    alert(`Trigger payment for $${pack.price}`);
  };

  const getTotalTokens = (pack) =>
    pack.tokens + Math.round(pack.tokens * pack.bonus);

  const topPacks = tokenPacks.slice(0, 3);
  const midPacks = tokenPacks.slice(3, 5);
  const infinityPack = tokenPacks[5];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white px-4 py-12">
      <style>{`
        .arrow-slide::before {
          content: "→";
          display: inline-block;
          margin: 0 0.5rem;
          color: white;
          transform: translateX(-4px);
          animation: slideArrow 0.6s ease forwards;
        }
        @keyframes slideArrow {
          from {
            opacity: 0;
            transform: translateX(-4px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>

      {/* Header with Balance */}
<div className="max-w-6xl mx-auto mb-6 px-2">
  <div className="flex flex-col items-center sm:flex-row sm:justify-between sm:items-center gap-2">
    <h1 className="text-3xl sm:text-4xl font-bold text-center sm:text-left">
      🪙 Buy Tokens
    </h1>
    {user && (
      <div className="text-sm text-gray-300 text-center sm:text-right w-full sm:w-auto">
        Your Balance:&nbsp;
        <span className="text-white font-bold">
          {user?.profile?.tokens ?? 0} tokens
        </span>
      </div>
    )}
  </div>
</div>

      <p className="text-center text-sm text-gray-400 mb-10">
        Use tokens to give gifts, unlock photos, extend chats, and more.
      </p>

      {/* Top Tiers */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {topPacks.map((pack) => {
          const total = getTotalTokens(pack);
          const hasBonus = pack.bonus > 0;
          return (
            <div
              key={pack.id}
              className="bg-white/5 border border-pink-400/30 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition"
            >
              <div className="flex justify-between items-baseline mb-1">
                <h2 className="text-xl font-semibold">{pack.label}</h2>
                <p className="text-pink-300 text-lg font-bold">
                  ${pack.price}
                </p>
              </div>
              <div className="mb-4">
                {hasBonus ? (
                  <p className="text-lg font-bold text-green-400">
                    <span className="line-through text-sm text-gray-400 mr-1">
                      {pack.tokens}
                    </span>
                    <span className="arrow-slide" />
                    {total} tokens
                  </p>
                ) : (
                  <p className="text-white text-lg font-semibold">
                    {pack.tokens} tokens
                  </p>
                )}
              </div>
              <button
                onClick={() => handlePurchase(pack)}
                className="w-full bg-pink-600 hover:bg-pink-700 text-white rounded-lg py-2 font-medium transition"
              >
                Buy Now
              </button>
            </div>
          );
        })}
      </div>

      {/* Mid Tiers */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {midPacks.map((pack) => {
          const total = getTotalTokens(pack);
          const hasBonus = pack.bonus > 0;
          return (
            <div
              key={pack.id}
              className="rounded-2xl p-6 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 border-[1.5px] border-blue-400/50 shadow-[0_8px_30px_rgba(0,210,255,0.2)] backdrop-blur-md transition hover:shadow-[0_10px_35px_rgba(0,210,255,0.3)]"
            >
              <div className="flex justify-between items-baseline mb-1">
                <h2 className="text-xl font-semibold text-blue-300">
                  {pack.label}
                </h2>
                <p className="text-blue-100 text-lg font-bold">
                  ${pack.price}
                </p>
              </div>
              <div className="mb-4">
                {hasBonus ? (
                  <p className="text-lg font-bold text-green-400">
                    <span className="line-through text-sm text-blue-100 mr-1">
                      {pack.tokens}
                    </span>
                    <span className="arrow-slide" />
                    {total} tokens
                  </p>
                ) : (
                  <p className="text-blue-200 text-lg font-semibold">
                    {pack.tokens} tokens
                  </p>
                )}
              </div>
              <button
                onClick={() => handlePurchase(pack)}
                className="w-full bg-blue-400 hover:bg-blue-300 text-black font-bold rounded-lg py-2 transition"
              >
                Buy Now
              </button>
            </div>
          );
        })}
      </div>

      {/* Infinity Pack (narrower width) */}
      <div className="max-w-4xl mx-auto mb-12">
        {(() => {
          const pack = infinityPack;
          const total = getTotalTokens(pack);
          const hasBonus = pack.bonus > 0;
          return (
            <div
              key={pack.id}
              className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 border-2 border-yellow-400 rounded-2xl p-8 shadow-2xl text-white text-center"
            >
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-3xl font-bold text-yellow-200">
                  {pack.label}
                </h2>
                <p className="text-2xl font-semibold text-white">
                  ${pack.price}
                </p>
              </div>
              <div className="mb-4">
                {hasBonus ? (
                  <p className="text-2xl font-bold text-green-400">
                    <span className="line-through text-yellow-100 text-sm mr-1">
                      {pack.tokens}
                    </span>
                    <span className="arrow-slide" />
                    {total} tokens
                  </p>
                ) : (
                  <p className="text-2xl font-bold text-yellow-100">
                    {pack.tokens} tokens
                  </p>
                )}
              </div>
              <button
                onClick={() => handlePurchase(pack)}
                className="w-full bg-yellow-300 hover:bg-yellow-200 text-yellow-900 font-bold rounded-lg py-2 transition"
              >
                Buy Now
              </button>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
