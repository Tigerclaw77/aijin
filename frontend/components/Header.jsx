"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../utils/supabaseClient";
import useAuthStore from "../store/authStore";

export default function Header() {
  const [loggedIn, setLoggedIn] = useState(false);
  const router = useRouter();
  const { logout } = useAuthStore();

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
    await logout(); // clear Zustand + Supabase session
    router.replace("/login"); // force redirect after logout
  };

  return (
    <header className="sticky top-0 z-50 w-full px-6 py-4 flex justify-between items-center bg-[var(--pink)] text-white border-b border-pink-300">
      <Link href="/">
        <div className="text-lg font-bold cursor-pointer text-white hover:text-black transition">
          aijin.ai
        </div>
      </Link>

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
    </header>
  );
}
