"use client";
export const runtime = "nodejs";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "../../utils/Supabase/supabaseClient";
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
    setError,
    setUser,
  } = useAuthStore();

  const router = useRouter();

  useEffect(() => {
    if (user) router.replace("/dashboard");
  }, [user, router]);

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
    const { error, user: authUser } = await login(email, password);

    if (!error && authUser) {
      // ✅ Fetch profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", authuser.id)
        .single();

      if (profileError) {
        console.error("❌ Failed to fetch profile:", profileError.message);
        setLocalError("Login failed (profile not found).");
        return;
      }

      setUser({ ...authUser, profile });

      if (profile.current_companion_id) {
        router.push("/dashboard");
      } else {
        router.push("/create");
      }
    } else if (error) {
      setLocalError(error.message || "Login failed.");
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">Sign In</h1>

      <div className="flex justify-center gap-4 mb-6">
        <button
          className={`px-4 py-2 rounded font-semibold ${
            mode === "magic"
              ? "bg-pink-600 text-white"
              : "bg-gray-300 text-black"
          }`}
          onClick={() => setMode("magic")}
        >
          Magic Link
        </button>
        <button
          className={`px-4 py-2 rounded font-semibold ${
            mode === "password"
              ? "bg-pink-600 text-white"
              : "bg-gray-300 text-black"
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
