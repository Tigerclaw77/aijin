"use client";

import { useState } from "react";
import { supabase } from "../utils/supabaseClient";

export default function UnlockIntimacyModal({
  companion,
  type, // "verbal" or "physical"
  onClose,
  onUnlock,
  tokenBalance = 9999,
  tokenCost = 1600,
}) {
  const [loading, setLoading] = useState(false);

  const title =
    type === "verbal" ? "Unlock Verbal Intimacy" : "Unlock Physical Intimacy";

  const handleUnlock = async () => {
    setLoading(true);

    if (!companion?.companion_id) {
      console.warn("⚠️ No companion_id provided.");
      setLoading(false);
      return;
    }

    const updates = {};
    if (type === "verbal") updates.verbal_intimacy = 2;
    if (type === "physical") updates.physical_intimacy = 2;

    const { error } = await supabase
      .from("companions")
      .update(updates)
      .eq("companion_id", companion.companion_id);

    setLoading(false);

    if (!error) {
      console.log("✅ Intimacy unlocked successfully.");
      onUnlock();
      onClose();
    } else {
      console.error("❌ Failed to unlock intimacy:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 p-6 rounded shadow max-w-sm w-full">
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
          {title}
        </h2>
        <p className="mb-4 text-gray-700 dark:text-gray-300">
          Spend {tokenCost} tokens to unlock this intimacy level?
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-white rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleUnlock}
            disabled={loading || tokenBalance < tokenCost}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {loading ? "Unlocking..." : "Unlock"}
          </button>
        </div>
      </div>
    </div>
  );
}
