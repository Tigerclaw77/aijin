'use client';
export const runtime = 'nodejs';

import { useEffect, useState } from 'react';

import { supabaseServer } from '../../../utils/Supabase/supabaseServerClient';
import useAuthStore from '../../store/authStore';

export default function AuthTest() {
  const [loading, setLoading] = useState(true);
  const { user, setUser, clearUser } = useAuthStore();

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabaseServer.auth.getSession();

      if (session?.user) {
        setUser(session.user);
      } else {
        clearUser();
      }

      setLoading(false);
    };

    getSession();

    // Optional: Listen for changes
    const { data: listener } = supabaseServer.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        clearUser();
      }
    });

    return () => listener?.subscription.unsubscribe();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-4">
      {user ? (
        <>
          <p className="mb-2">Logged in as: {user.email}</p>
          <button
            className="bg-red-500 text-white px-4 py-2 rounded"
            onClick={async () => {
              await supabaseServer.auth.signOut();
              clearUser();
            }}
          >
            Logout
          </button>
        </>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const email = e.target.email.value;
            await supabaseServer.auth.signInWithOtp({ email });
            alert('Check your email for the magic link');
          }}
        >
          <input
            name="email"
            type="email"
            placeholder="Enter your email"
            className="border p-2 mr-2"
          />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
            Send Magic Link
          </button>
        </form>
      )}
    </div>
  );
}
