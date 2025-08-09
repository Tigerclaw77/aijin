"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { supabase } from "../utils/Supabase/supabaseClient";
import useAuthStore from "../store/authStore";

export default function Header() {
  const [loggedIn, setLoggedIn] = useState(false);
  const router = useRouter();
  const { user, logout } = useAuthStore();

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data }) => {
      setLoggedIn(!!data?.session?.user);
    });

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session?.user);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <header className="sticky top-0 z-50 w-full px-6 py-4 flex justify-between items-center bg-[var(--pink)] text-white border-b border-pink-300">
      <Link href="/">
        <div className="text-lg font-bold cursor-pointer text-white hover:text-black transition">
          aijin.ai
        </div>
      </Link>

      <div className="flex items-center gap-4">
        {loggedIn && user?.profile && (
          <div className="text-sm bg-white/10 text-white px-3 py-1 rounded-full">
            💰 {user.profile.tokens ?? 0} tokens
          </div>
        )}

        {loggedIn ? (
          <button
            onClick={handleLogout}
            className="text-sm text-white hover:text-black transition"
          >
            Logout
          </button>
        ) : (
          <Link href="/login">
            <div className="text-sm text-white hover:text-black transition cursor-pointer">
              Login
            </div>
          </Link>
        )}
      </div>
    </header>
  );
}
