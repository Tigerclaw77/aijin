"use client";
import { useEffect, useState } from "react";

import { supabase } from "../utils/Supabase/supabaseClient";

export default function SplashGate({ children }) {
  const [allowed, setAllowed] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error

  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("preview");
    if (code === "approved") {
      setAllowed(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");

    const { error } = await supabase.from("email_waitlist").insert([{ email }]);

    if (error) {
      console.error("❌ Failed to save email:", error.message);
      setStatus("error");
    } else {
      setStatus("success");
    }
  };

  if (!allowed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white px-6 py-12">
        <h1 className="text-4xl font-bold mb-4 text-center">
          Aijin is Coming Soon
        </h1>
        <p className="text-gray-400 text-center max-w-xl mb-8">
          We’re putting the final touches on your future favorite AI companions.
          Use a private link for early access.
        </p>

        {/* Preview Models */}
        <div className="flex gap-4 justify-center mb-10 flex-wrap">
          <div className="flex flex-col items-center">
            <img
              src="/sample-avatars/sample_a.png"
              alt="sample_a"
              className="w-32 h-48 object-cover rounded-xl shadow-lg border-2 border-pink-400"
            />
            <p className="mt-2 text-sm text-gray-300">Heather</p>
          </div>
          <div className="flex flex-col items-center">
            <img
              src="/sample-avatars/sample_b.png"
              alt="sample_b"
              className="w-32 h-48 object-cover rounded-xl shadow-lg border-2 border-yellow-400"
            />
            <p className="mt-2 text-sm text-gray-300">Sarah</p>
          </div>
          <div className="flex flex-col items-center">
            <img
              src="/sample-avatars/sample_c.png"
              alt="sample_c"
              className="w-32 h-48 object-cover rounded-xl shadow-lg border-2 border-blue-400"
            />
            <p className="mt-2 text-sm text-gray-300">Brooke</p>
          </div>
        </div>

        {/* Email capture */}
        <form onSubmit={handleSubmit} className="w-full max-w-sm mx-auto mb-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full px-4 py-2 rounded-md text-black bg-white placeholder-gray-500 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-500"
            required
          />

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full mt-3 bg-pink-600 hover:bg-pink-500 text-white font-semibold py-2 px-4 rounded"
          >
            {status === "loading" ? "Sending..." : "Notify Me on Launch"}
          </button>
          {status === "success" && (
            <p className="text-green-400 text-sm mt-2">
              Thanks! We’ll keep you updated.
            </p>
          )}
          {status === "error" && (
            <p className="text-red-400 text-sm mt-2">
              Error saving email. Try again.
            </p>
          )}
        </form>

        <p className="text-xs text-gray-600 text-center mt-4">
          © {new Date().getFullYear()} Aijin.ai — All rights reserved.
        </p>
      </div>
    );
  }

  return children;
}
