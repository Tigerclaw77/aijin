"use client";

export default function GiftShopModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-lg w-full relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-3 text-gray-400 hover:text-black text-lg"
        >
          ✕
        </button>
        <h2 className="text-xl font-bold mb-4">🎁 Gift Shop</h2>
        <p className="text-sm text-gray-600 mb-2">
          Here's where you'll soon be able to send gifts like jewelry, flowers,
          love letters, or lingerie to your companion. Each one has emotional or
          intimacy effects — some unlock new content.
        </p>
        <p className="text-xs text-gray-400 mt-2">
          (Coming soon – we're still stocking the shelves.)
        </p>
      </div>
    </div>
  );
}
