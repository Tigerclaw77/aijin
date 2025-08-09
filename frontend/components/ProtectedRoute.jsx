'use client';
export const runtime = 'nodejs';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import useAuthStore from '../store/authStore';

export default function ProtectedRoute({ children }) {
  const { user, fetchUser } = useAuthStore();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      await fetchUser(); // Load user from Supabase
      const latestUser = useAuthStore.getState().user;

      if (!latestUser) {
        router.replace("/login");
      } else {
        setChecked(true);
      }
    };

    checkAuth();
  }, []);

  if (!checked) return null;

  return children;
}
