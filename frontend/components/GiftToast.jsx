"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const giftDetails = {
  Tea: { label: "Tea", cost: 100, duration: "N/A" },
  Coffee: { label: "Coffee", cost: 200, duration: "N/A" },
  Boba: { label: "Boba (12h Unlimited)", cost: 300, duration: "12h" },
  "Energy Drink": { label: "Energy Drink (24h Unlimited)", cost: 400, duration: "24h" },
};

export default function GiftToast({
  giftName,
  userTokens = 0,
  onClose,
  onBuyMore,
}) {
  const router = useRouter();
  const [confirmed, setConfirmed] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const gift = giftName && giftDetails[giftName];
  const notEnoughTokens = !gift || userTokens < gift.cost;

  const handleConfirm = () => {
    if (!gift || notEnoughTokens) return;
    setConfirmed(true);
    setShowSuccess(true);

    // Simulate successful gift send
    setTimeout(() => {
      setShowSuccess(false);
      onClose();
    }, 1800);
  };

  const handleCancel = () => {
    onClose();
  };

  if (!gift) {
    return (
      <div className="fixed bottom-6 right-6 bg-red-100 text-red-800 px-4 py-2 rounded-lg shadow z-50">
        ⚠️ Unknown gift selected.
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 bg-white shadow-lg rounded-xl px-6 py-4 max-w-sm w-full z-50 animate-fade-in-up border border-pink-300">
      {!confirmed && (
        <>
          <p className="text-gray-800 text-sm mb-2">
            🎁 Spend <strong>{gift.cost} tokens</strong> to give <strong>{gift.label}</strong>?
          </p>
          {notEnoughTokens && (
            <p className="text-red-500 text-xs mb-2">You don't have enough tokens.</p>
          )}
          <div className="flex justify-end gap-3 mt-2">
            <button
              className="text-gray-500 hover:text-gray-700 text-sm"
              onClick={handleCancel}
            >
              Cancel
            </button>
            {!notEnoughTokens ? (
              <button
                onClick={handleConfirm}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded text-sm shadow"
              >
                Confirm
              </button>
            ) : (
              <button
                onClick={onBuyMore || (() => router.push("/tokens"))}
                className="bg-pink-500 hover:bg-pink-600 text-white px-3 py-1 rounded text-sm shadow"
              >
                Buy Tokens
              </button>
            )}
          </div>
        </>
      )}

      {showSuccess && (
        <p className="text-green-600 text-sm font-medium">🎉 Gift sent successfully!</p>
      )}
    </div>
  );
}
