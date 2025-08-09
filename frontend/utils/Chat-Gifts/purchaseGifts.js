// utils/Chat-Gifts/purchaseGifts.js
import { supabase } from '../Supabase/supabaseClient';

export async function purchaseGift(companion_id, giftKey) {
  if (!companion_id || !giftKey) {
    const err = new Error('BAD_REQUEST');
    err.code = 'BAD_REQUEST';
    throw err;
  }

  // Get current session token from the browser
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;

  const res = await fetch('/api/gifts/purchase', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ companion_id, giftKey }),
  });

  let data;
  try {
    data = await res.json();
  } catch {
    const e = new Error('SERVER_ERROR');
    e.code = 'SERVER_ERROR';
    throw e;
  }

  if (!res.ok || !data?.ok) {
    const e = new Error(data?.message || `HTTP_${res.status}`);
    e.code = data?.code || `HTTP_${res.status}`;
    e.status = res.status;
    throw e;
  }

  return data;
}
