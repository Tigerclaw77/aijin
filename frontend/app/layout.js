'use client';
export const runtime = 'nodejs';

import { useEffect } from "react";
import { supabase } from "../utils/supabaseClient";
import './globals.css';

import Header from '../components/Header';
import Footer from '../components/Footer';
import SyncCompanionState from '../components/SyncCompanionState';

import { Geist, Geist_Mono, Great_Vibes } from "next/font/google";
import useAuthStore from "../store/authStore"; // <-- ADDED

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const greatVibes = Great_Vibes({
  variable: "--font-great-vibes",
  weight: "400",
  subsets: ["latin"],
});

if (typeof window !== "undefined") {
  window.supabase = supabase;
}

export default function RootLayout({ children }) {
  const { hydrate, hasHydrated } = useAuthStore(); // <-- ADDED

  useEffect(() => {
    hydrate(); // <-- Hydrate user + profile
  }, []);

  if (!hasHydrated) {
    return (
      <html lang="en">
        <body
          className={`bg-black text-white flex items-center justify-center min-h-screen`}
        >
          <p className="text-lg">Loading...</p>
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <body
        className={`
          ${geistSans.variable}
          ${geistMono.variable}
          ${greatVibes.variable}
          antialiased
          bg-black text-white
          flex flex-col min-h-screen
        `}
      >
        <Header />
        <SyncCompanionState />
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
