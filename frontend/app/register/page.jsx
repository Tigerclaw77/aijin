"use client";
export const runtime = "nodejs";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "../../store/authStore";

export default function RegisterPage() {
  const router = useRouter();
  const {
    register,
    user,
    isAuthenticated,
    logout,
  } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      router.replace("/dashboard"); // Redirect logged-in users
    }
  }, [user]);

  const handleRegister = async () => {
    setError(null);

    if (!ageConfirmed) {
      setError("You must confirm that you are 18 years or older.");
      return;
    }

    setLoading(true);
    const { data, error } = await register(email, password);
    setLoading(false);

    if (error) {
      if (error.message.includes("User already registered")) {
        setError("An account with this email already exists.");
      } else {
        setError(error.message || "Registration failed.");
      }
      return;
    }

    router.push("/create-companion");
  };

  return user ? null : (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">
          Create an Account
        </h1>

        <label className="block mb-3">
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Email
          </span>
          <input
            type="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 mt-1 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="you@example.com"
          />
        </label>

        <label className="block mb-3 relative">
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Password
          </span>
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 mt-1 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white pr-16"
            placeholder="Choose a password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-9 text-sm text-gray-500 dark:text-gray-400"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </label>

        <label className="inline-flex items-center mb-4 text-sm text-gray-600 dark:text-gray-300">
          <input
            type="checkbox"
            checked={ageConfirmed}
            onChange={() => setAgeConfirmed(!ageConfirmed)}
            className="mr-2"
          />
          I am 18 years or older
        </label>

        <button
          onClick={handleRegister}
          disabled={loading}
          className="w-full bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2 px-4 rounded disabled:opacity-50"
        >
          {loading ? "Creating Account..." : "Sign Up"}
        </button>

        {error && <p className="mt-3 text-red-600 text-sm">{error}</p>}

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
          By signing up, you agree to our{" "}
          <a href="/terms" className="underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="/privacy" className="underline">
            Privacy Policy
          </a>
          .
        </p>

        <hr className="my-4 border-gray-300 dark:border-gray-700" />

        <p className="text-sm text-center text-gray-600 dark:text-gray-300">
          Already have an account?{" "}
          <a href="/login" className="text-pink-600 hover:underline">
            Log in
          </a>
        </p>

        <p className="text-sm text-center mt-2 text-gray-600 dark:text-gray-400">
          Or{" "}
          <button
            onClick={() => router.push("/guest-preview")}
            className="underline text-blue-500 hover:text-blue-600"
          >
            preview companions as guest
          </button>
        </p>
      </div>
    </main>
  );
}
