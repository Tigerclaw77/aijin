import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// From /frontend/app/api/send-gift/route.js → /frontend/utils/** is THREE levels up
import {
  processVerbalIntimacy,
  processPhysicalIntimacy,
} from "../../../utils/Intimacy/intimacyStateManagerSplit.js";

import { getGiftEffectList } from "../../../utils/Chat-Gifts/giftUtils.js";

export async function POST(req) {
  try {
    const body = await req.json();
    const { companion_id, gift_name, gift_id, quantity = 1 } = body || {};

    if (!companion_id || (!gift_name && !gift_id)) {
      return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });
    }

    // Auth (SSR client using request cookies)
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get: (n) => cookieStore.get(n)?.value,
        },
      }
    );

    // Verify session
    const { data: auth, error: authErr } = await supabase.auth.getUser();
    if (authErr || !auth?.user) {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }
    const user_id = auth.user.id;

    // Load companion
    const { data: companion, error: compErr } = await supabase
      .from("companions")
      .select(
        [
          "companion_id",
          "user_id",
          "sub_tier",
          "is_paused",
          "verbal_intimacy",
          "physical_intimacy",
        ].join(",")
      )
      .eq("companion_id", companion_id)
      .single();

    if (compErr || !companion) {
      return NextResponse.json({ error: "COMPANION_NOT_FOUND" }, { status: 404 });
    }
    if (companion.user_id !== user_id) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    // Look up gift (by id or name)
    let giftRow = null;
    if (gift_id) {
      const { data, error } = await supabase
        .from("gift_shop")
        .select("id, name, price, available")
        .eq("id", gift_id)
        .single();
      if (error) return NextResponse.json({ error: "UNKNOWN_GIFT" }, { status: 400 });
      giftRow = data;
    } else {
      const { data, error } = await supabase
        .from("gift_shop")
        .select("id, name, price, available")
        .ilike("name", gift_name) // case-insensitive
        .maybeSingle();
      if (error || !data) return NextResponse.json({ error: "UNKNOWN_GIFT" }, { status: 400 });
      giftRow = data;
    }
    if (giftRow.available === false) {
      return NextResponse.json({ error: "GIFT_UNAVAILABLE" }, { status: 409 });
    }

    // Pricing — use sub_tier directly (no "premium")
    const normTier = String(companion.sub_tier || "free").toLowerCase();

    // Drink discounts (girlfriend/waifu only)
    const isDrink = ["tea", "coffee", "boba", "energy drink"].includes(
      String(giftRow.name || "").toLowerCase()
    );
    let finalUnitPrice = Math.floor(Number(giftRow.price) || 0);
    if (isDrink) {
      if (normTier === "girlfriend") finalUnitPrice = Math.floor(finalUnitPrice * 0.75);
      else if (normTier === "waifu") finalUnitPrice = Math.floor(finalUnitPrice * 0.5);
    }

    const qty = Math.max(1, Number(quantity) || 1);
    const totalCost = finalUnitPrice * qty;

    // Atomic token deduct (RPC)
    const { data: rpcData, error: rpcErr } = await supabase.rpc("deduct_tokens", {
      p_user_id: user_id,
      p_amount: totalCost,
    });
    if (rpcErr) {
      console.error("deduct_tokens RPC error:", rpcErr);
      return NextResponse.json({ error: "PURCHASE_FAILED" }, { status: 500 });
    }
    const newBalance = rpcData?.[0]?.new_balance;
    if (newBalance == null) {
      return NextResponse.json({ error: "INSUFFICIENT_TOKENS" }, { status: 402 });
    }

    // Log purchase + history
    await supabase.from("gift_transactions").insert({
      user_id,
      companion_id,
      gift_id: giftRow.id,
      quantity: qty,
      total_spent: totalCost,
      token_price: finalUnitPrice,
      status: "completed",
      platform: "web",
      notes: `sub_tier=${normTier};name=${giftRow.name}`,
    });

    await supabase.from("gift_history").insert({
      user_id,
      companion_id,
      gift_id: giftRow.id,
      quantity: qty,
    });

    // Intimacy recalculation (immediate bump via your legacy engines)
    const now = new Date();
    const giftList = getGiftEffectList(
      Array.from({ length: qty }, () => ({ id: giftRow.id, given_at: now }))
    );

    const baseState = {
      rank: 3, // seed; your process* functions ignore/override as needed
      isPaused: companion.is_paused ?? false,
      daysInactive: 0,
      messagesToday: 0,
      interactionScore: 1.0,
      giftList,
    };

    const updatedVerbal = processVerbalIntimacy({
      ...baseState,
      currentIntimacy: companion.verbal_intimacy || 1,
    });

    const updatedPhysical = processPhysicalIntimacy({
      ...baseState,
      currentIntimacy: companion.physical_intimacy || 1,
    });

    // Persist updated levels
    const { error: upErr } = await supabase
      .from("companions")
      .update({
        verbal_intimacy: updatedVerbal,
        physical_intimacy: updatedPhysical,
        updated_at: now.toISOString(),
      })
      .eq("companion_id", companion_id);

    if (upErr) {
      console.error("Update companions failed:", upErr);
      return NextResponse.json({ error: "UPDATE_FAILED" }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      appliedTier: normTier,
      finalUnitPrice,
      newBalance, // from RPC
      updatedVerbalIntimacy: updatedVerbal,
      updatedPhysicalIntimacy: updatedPhysical,
    });
  } catch (e) {
    console.error("gift purchase error:", e);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
