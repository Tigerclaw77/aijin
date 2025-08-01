"use client";

import { useState } from "react";
import ConfirmBreakupModal from "./ConfirmBreakupModal";

export default function CompanionActions({ companion }) {
  const [showModal, setShowModal] = useState(false);

  const handlePause = async () => {
    await fetch("/api/companions/update-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companion_id: companion.companion_id,
        newStatus: "paused",
      }),
    });
    window.location.reload();
  };

  const handleFavorite = async () => {
    await fetch("/api/companions/update-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companion_id: companion.companion_id,
        newStatus: "favorite",
      }),
    });
    window.location.reload();
  };

  return (
    <div className="flex gap-2 mt-2">
      <button
        onClick={handlePause}
        className="px-2 py-1 text-sm bg-yellow-600 rounded hover:bg-yellow-500"
      >
        Pause
      </button>
      <button
        onClick={handleFavorite}
        className="px-2 py-1 text-sm bg-purple-600 rounded hover:bg-purple-500"
      >
        Favorite
      </button>
      <button
        onClick={() => setShowModal(true)}
        className="px-2 py-1 text-sm bg-red-600 rounded hover:bg-red-500"
      >
        Break Up
      </button>

      {showModal && (
        <ConfirmBreakupModal
          companion={companion}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
