import { create } from "zustand";
import { supabase } from "../utils/supabaseClient";

const useAuthStore = create((set) => ({
  user: null,
  loading: false,
  error: null,
  hasHydrated: false,

  hydrate: async () => {
    set({ loading: true });

    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();
    const user = sessionData?.session?.user;

    if (user) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) console.error("Profile fetch error:", profileError);

      set({
        user: { ...user, profile },
        hasHydrated: true,
        loading: false,
        error: sessionError || profileError,
      });
    } else {
      set({
        user: null,
        hasHydrated: true,
        loading: false,
        error: sessionError,
      });
    }
  },

  fetchUser: async () => {
    const { data: sessionData, error } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    if (error) console.error("Fetch user error:", error);
    set({ user });
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Login error:", error);
      set({ loading: false, error });
      return { data, error };
    }

    let profile = null;
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single();
    if (profileError) console.error("Profile fetch error:", profileError);
    profile = profileData;

    set({
      user: { ...data.user, profile },
      loading: false,
      error: null,
    });

    return { data, error };
  },

  register: async (email, password) => {
    set({ loading: true, error: null });
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      console.error("Register error:", error);
      set({ loading: false, error });
      return { data, error };
    }

    set({
      user: data?.user ? { ...data.user, profile: null } : null,
      loading: false,
      error: null,
    });

    return { data, error };
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, loading: false, error: null });
  },
  ogout: async () => {
    await supabase.auth.signOut();
    set({ user: null, hasHydrated: false, loading: false, error: null });
  },

  isAdmin: () => {
    const state = useAuthStore.getState();
    return state.user?.profile?.is_admin === true;
  },
}));

export default useAuthStore;
