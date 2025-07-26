'use client';
export const runtime = 'nodejs';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '../store/authStore';

export default function ProtectedRoute({ children }) {
  const { user, hasHydrated, fetchUser } = useAuthStore();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;

    const checkAuth = async () => {
      await fetchUser(); // waits for Supabase session
      const latestUser = useAuthStore.getState().user;

      if (!latestUser) {
        router.replace("/login");
      } else {
        setChecked(true); // ✅ now allow rendering
      }
    };

    checkAuth();
  }, [hasHydrated]);

  if (!hasHydrated || !checked) return null;

  return children;
}
