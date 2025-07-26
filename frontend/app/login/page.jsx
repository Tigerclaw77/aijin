"use client";
export const runtime = "nodejs";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../utils/supabaseClient";
import useAuthStore from "../../store/authStore";

export default function LoginPage() {
  const [mode, setMode] = useState("magic"); // 'magic' or 'password'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sent, setSent] = useState(false);
  const [localError, setLocalError] = useState(null);

  const {
    user,
    login,
    logout,
    loading,
    error: storeError,
    hasHydrated,
    setError,
  } = useAuthStore();

  const router = useRouter();

  // ✅ Redirect only after hydration is complete
  useEffect(() => {
    if (!hasHydrated) return;
    if (user) router.replace("/dashboard");
  }, [hasHydrated, user, router]);

  // ✅ Clear local errors on popstate (back button)
  useEffect(() => {
    const clearError = () => {
      setLocalError(null);
      if (setError) setError(null);
    };
    router.prefetch("/dashboard");
    window.addEventListener("popstate", clearError);
    return () => window.removeEventListener("popstate", clearError);
  }, [router, setError]);

  const handleMagicLink = async (e) => {
    e.preventDefault();
    setLocalError(null);
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) {
      setLocalError(error.message);
    } else {
      setSent(true);
    }
  };

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setLocalError(null);
    const { error } = await login(email, password);
    if (!error) {
      router.push("/create"); // or "/dashboard" depending on flow
    } else {
      setLocalError(error.message || "Login failed.");
    }
  };

  // 🛡 Block UI from showing if still hydrating or redirecting
  if (!hasHydrated || user) return null;

  return (
    <div className="max-w-md mx-auto p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">Sign In</h1>

      <div className="flex justify-center gap-4 mb-6">
        <button
          className={`px-4 py-2 rounded font-semibold ${
            mode === "magic" ? "bg-pink-600 text-white" : "bg-gray-300 text-black"
          }`}
          onClick={() => setMode("magic")}
        >
          Magic Link
        </button>
        <button
          className={`px-4 py-2 rounded font-semibold ${
            mode === "password" ? "bg-pink-600 text-white" : "bg-gray-300 text-black"
          }`}
          onClick={() => setMode("password")}
        >
          Password
        </button>
      </div>

      {mode === "magic" ? (
        <form onSubmit={handleMagicLink} className="space-y-4">
          <input
            type="email"
            placeholder="Your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-2 rounded bg-white text-black border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
          <button
            type="submit"
            disabled={sent}
            className="w-full bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded"
          >
            {sent ? "Check Your Email" : "Send Magic Link"}
          </button>
        </form>
      ) : (
        <form onSubmit={handlePasswordLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-2 rounded bg-white text-black border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-2 rounded bg-white text-black border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      )}

      <p className="text-sm mt-2">
        <a href="/forgot-password" className="text-blue-400 hover:underline">
          Forgot your password?
        </a>
      </p>

      {(localError || storeError) && (
        <p className="text-red-500 text-sm mt-2">
          {localError || storeError.message}
        </p>
      )}

      <p className="text-sm text-center mt-6">
        Don’t have an account?{" "}
        <a href="/register" className="text-pink-500 underline">
          Sign up
        </a>
      </p>
    </div>
  );
}
