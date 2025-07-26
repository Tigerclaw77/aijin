'use client';
export const runtime = 'nodejs';

import { create } from "zustand";
import { supabase } from "../utils/supabaseClient";

const useUserStore = create((set) => ({
  user: null,
  loading: false,
  error: null,

  fetchUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) console.error("User fetch error:", error);
    set({ user });
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    console.log("Login result:", data, error);
    set({ user: data?.user || null, loading: false, error });
  },

  register: async (email, password) => {
    set({ loading: true, error: null });

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    console.log("Signup result:", signUpData, signUpError);

    if (signUpError) {
      set({ loading: false, error: signUpError });
      return;
    }

    // Force session creation manually by logging in again
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    console.log("Forced login after signup:", loginData, loginError);
    console.log("Cookies after login:", document.cookie);

    if (loginError || !loginData?.user) {
      set({ loading: false, error: loginError || new Error("Session still missing after forced login") });
      return;
    }

    set({ user: loginData.user, loading: false, error: null });
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  },
}));

export default useUserStore;
