// app/forgot-password/page.jsx
"use client";
import { useState } from "react";

import { supabaseServer } from "../../utils/Supabase/supabaseServerClient";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  const handleReset = async () => {
    const { error } = await supabaseServer.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  };

  return (
    <main className="p-6 max-w-md mx-auto">
      <h1 className="text-xl font-semibold mb-4">Reset Password</h1>

      {!sent ? (
        <>
          <input
            type="email"
            className="border p-2 w-full mb-4"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            className="bg-pink-600 text-white px-4 py-2 rounded"
            onClick={handleReset}
          >
            Send Reset Link
          </button>
          {error && <p className="text-red-600 mt-2">{error}</p>}
        </>
      ) : (
        <p className="text-green-700">Check your email for a reset link.</p>
      )}
    </main>
  );
}
