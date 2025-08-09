'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { supabase } from '../utils/Supabase/supabaseClient';

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        setLoggedIn(true);
      }
      setLoading(false);
    };

    checkSession();
  }, [router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
  <main className="flex flex-col justify-center items-center min-h-[calc(100vh-6rem)] px-4 py-12 text-white text-center bg-black">
    <h1 className="text-4xl font-bold mb-4">Meet Your AI Companion</h1>
    <p className="text-lg text-gray-300 mb-8 max-w-xl">
      Choose your companion. Chat daily. Grow something real.
    </p>
    <p className="text-gray-500 text-base leading-relaxed max-w-xl mb-8">
      Each AI partner has a unique personality, memory, and emotional rhythm.
      You’ll share conversations, unlock intimacy, and build a bond that grows
      over time. Every interaction shapes her — and deepens your connection.
    </p>
    <div className="flex flex-wrap gap-4 justify-center">
      <button
        onClick={() => router.push("/guest-preview")}
        className="bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2 px-6 rounded"
      >
        Sneak a Peek
      </button>
      <button
        onClick={() => router.push(loggedIn ? "/create" : "/login")}
        className="bg-gray-800 hover:bg-gray-700 text-white font-semibold py-2 px-6 rounded"
      >
        Create Her
      </button>
      {loggedIn ? (
        <button
          onClick={() => router.push("/dashboard")}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded"
        >
          Go to Dashboard
        </button>
      ) : (
        <button
          onClick={() => router.push("/login")}
          className="bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-6 rounded"
        >
          Sign In
        </button>
      )}
    </div>
  </main>
);
}
