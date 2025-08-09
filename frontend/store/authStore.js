// export default useAuthStore;

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { supabase } from '../utils/Supabase/supabaseClient';
import { updateCompanionIntimacy } from '../utils/Intimacy/intimacyApiClient';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      loading: false,
      error: null,

      fetchUser: async () => {
        set({ loading: true, error: null });
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        const user = sessionData?.session?.user;

        if (user?.id) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (profileError) console.error('Profile fetch error:', profileError);

          set({
            user: {
              ...user,
              profile: {
                ...profile,
                tokens: profile?.tokens ?? 0,
                user_id: user.id,
              },
            },
            loading: false,
            error: sessionError || profileError,
          });
        } else {
          set({
            user: null,
            loading: false,
            error: sessionError,
          });
        }
      },

      login: async (email, password) => {
        set({ loading: true, error: null });
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          console.error('Login error:', error);
          set({ loading: false, error });
          return { data, error };
        }

        const userId = data?.user?.id;

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (profileError) console.error('Profile fetch error:', profileError);

        set({
          user: {
            ...data.user,
            profile: {
              ...profile,
              tokens: profile?.tokens ?? 0,
              user_id: userId,
            },
          },
          loading: false,
          error: null,
        });

        await updateCompanionIntimacy(userId, profile?.selected_companion_id);
        return { data, error };
      },

      register: async (email, password) => {
        set({ loading: true, error: null });
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          console.error('Register error:', error);
          set({ loading: false, error });
          return { data, error };
        }

        set({
          user: data?.user ? { ...data.user, profile: { tokens: 0 } } : null,
          loading: false,
          error: null,
        });

        return { data, error };
      },

      logout: async () => {
        await supabase.auth.signOut();
        set({ user: null, loading: false, error: null });
      },

      updateTokens: (newAmount) =>
        set((state) => ({
          user: {
            ...state.user,
            profile: {
              ...state.user?.profile,
              tokens: newAmount,
            },
          },
        })),

      updateUserProfile: (newProfile) =>
        set((state) => ({
          user: {
            ...state.user,
            profile: {
              ...state.user?.profile,
              ...newProfile,
            },
          },
        })),

      isAdmin: () => {
        const state = get();
        return state.user?.profile?.is_admin === true;
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);

export default useAuthStore;
