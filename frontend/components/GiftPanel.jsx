"use client";

export default function GiftPanel({
  onGiftUsed,
  tier = "free",
  onGiftShop,
  disabled,
}) {
  const isPremium = ["crush", "girlfriend", "waifu", "harem"].includes(tier);

  const gifts = [
    {
      id: "tea",
      name: "Tea",
      description: isPremium ? "💬 Just for fun" : "+10 messages",
      cost: isPremium ? 0 : 100,
      effect: isPremium ? { emotion: "warmth" } : { extraMessages: 10 },
      emoji: "🍵",
    },
    {
      id: "coffee",
      name: "Coffee",
      description: isPremium ? "☕ Just for fun" : "+25 messages",
      cost: isPremium ? 0 : 200,
      effect: isPremium ? { affection: "strong" } : { extraMessages: 25 },
      emoji: "☕",
    },
    {
      id: "boba",
      name: "Boba",
      description: isPremium ? "🧋 Just for fun" : "Unlimited chat for 12h",
      cost: isPremium ? 0 : 300,
      effect: isPremium ? { charm: "bubbly" } : { unlimited: 12 },
      emoji: "🧋",
    },
    {
      id: "energy",
      name: "Energy Drink",
      description: isPremium ? "🥤 Let’s get wild!" : "Unlimited chat for 24h",
      cost: isPremium ? 0 : 400,
      effect: isPremium ? { emotion: "excited" } : { unlimited: 24 },
      emoji: "🥤",
    },
  ];

  return (
  <div className="flex gap-3 items-stretch">
    {/* Gift Cards */}
    <div className="flex flex-1 gap-3 min-w-0">
      {gifts.map((gift) => (
        <div
          key={gift.id}
          className={`flex flex-col justify-between flex-1 rounded-lg p-3 text-center shadow-md border ${
            tier === "premium"
              ? "opacity-50 cursor-not-allowed bg-white"
              : "bg-white"
          }`}
        >
          <div className="text-3xl mb-1">{gift.emoji}</div>
          <div className="font-semibold text-gray-700">{gift.name}</div>
          <div className="text-xs text-gray-500">{gift.description}</div>
          <div className="mt-auto pt-2">
            <button
              className={`w-full text-xs px-3 py-1.5 rounded bg-pink-500 text-white hover:bg-pink-600 transition ${
                tier === "premium" ? "opacity-40 pointer-events-none" : ""
              }`}
              onClick={() => onGiftUsed(gift)}
            >
              🪙 {gift.cost}
            </button>
          </div>
        </div>
      ))}
    </div>

    {/* More Gifts Card */}
    <div className="flex flex-col justify-between w-[88px] h-[118px] mt-16 p-3 text-center shadow-md border bg-purple-800 rounded-lg">
      <div className="text-3xl mb-1">🛍️</div>
      <div className="font-semibold text-white text-xs leading-tight">
        More Gifts
      </div>
      <div className="mt-auto pt-2">
        <button
          onClick={onGiftShop}
          className="w-full text-xs px-2 py-1.5 rounded bg-purple-500 text-white hover:bg-purple-600 transition"
        >
          Browse
        </button>
      </div>
    </div>
  </div>
);

}
