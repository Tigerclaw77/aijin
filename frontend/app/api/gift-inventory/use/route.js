// app/api/gift-inventory/use/route.js

import { NextResponse } from "next/server";

import { supabaseServer } from "../../../../utils/Supabase/supabaseServerClient";

export async function POST(req) {
  const { user_id, gift_id } = await req.json();

  if (!user_id || !gift_id) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  // Decrease quantity by 1
  const { data, error } = await supabaseServer.rpc("decrement_gift_inventory", {
    uid: user_id,
    gid: gift_id,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, remaining: data?.quantity });
}
