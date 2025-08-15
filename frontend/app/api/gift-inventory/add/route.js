// app/api/gift-inventory/add/route.js

import { NextResponse } from 'next/server';

import { supabaseServer } from '../../../../../utils/Supabase/supabaseServerClient';

export async function POST(req) {
  const { user_id, gift_id, quantity = 1 } = await req.json();

  if (!user_id || !gift_id) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Add or increment gift in inventory
  const { error } = await supabaseServer.rpc('upsert_gift_inventory', {
    uid: user_id,
    gid: gift_id,
    qty: quantity,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
