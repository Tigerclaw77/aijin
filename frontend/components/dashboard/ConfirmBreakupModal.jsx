"use client";

import { useState } from "react";

import { sendBreakupRequest } from "../../utils/Breakup/breakupClient";

export default function ConfirmBreakupModal({ isOpen, onClose, companion }) {
  const [loading, setLoading] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !companion) return null;

  const handleBreakup = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await sendBreakupRequest(companion.companion_id, "sms"); // or "email"
      if (res.success) {
        setConfirmationSent(true);
      } else {
        throw new Error(res.error || "Failed to send confirmation.");
      }
    } catch (err) {
      console.error("Breakup error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-gray-800 p-6 rounded-xl shadow-lg max-w-md w-full">
        {confirmationSent ? (
          <div className="text-center text-white">
            <h2 className="text-xl font-semibold mb-2">Confirmation Sent</h2>
            <p className="text-gray-300">
              A breakup confirmation link was sent to your email or phone. Your
              companion won’t be deleted until confirmed.
            </p>
            <button
              onClick={onClose}
              className="mt-6 px-4 py-2 bg-slate-600 rounded hover:bg-slate-700"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold text-white mb-4">
              Break up with {companion.customName || companion.model_name}?
            </h2>
            <p className="text-gray-300 mb-4">
              This will send a confirmation link to finalize the breakup. You
              can cancel later if you change your mind.
            </p>
            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
            <div className="flex justify-end space-x-4">
              <button
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleBreakup}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                {loading ? "Sending..." : "Send Confirmation"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
