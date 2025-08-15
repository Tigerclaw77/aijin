'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { supabaseServer } from '../../../utils/Supabase/supabaseServerClient';

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleSubmit = async () => {
    const { error } = await supabaseServer.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => router.push('/login'), 2000);
    }
  };

  return (
    <main className="p-6 max-w-md mx-auto">
      <h1 className="text-xl font-semibold mb-4">Set New Password</h1>
      <input
        type="password"
        className="border p-2 w-full mb-4"
        placeholder="New password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
      />
      <button className="bg-pink-600 text-white px-4 py-2 rounded" onClick={handleSubmit}>
        Update Password
      </button>
      {error && <p className="text-red-600 mt-2">{error}</p>}
      {success && <p className="text-green-700">Password updated!</p>}
    </main>
  );
}
