// /app/api/admin/update-companion-tier/route.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const ALLOWED_SUB_TIERS = new Set(["sample","free","friend","crush","girlfriend","waifu","harem"]);

function normalizeTier(t) {
  const x = (t || "").toLowerCase().trim();
  if (!x) return null;
  if (x === "premium") return "girlfriend";
  return x;
}

export async function POST(req) {
  try {
    const { companion_id, sub_tier } = await req.json();
    if (!companion_id || !sub_tier) {
      return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });
    }

    const normalized = normalizeTier(sub_tier);
    if (!normalized || !ALLOWED_SUB_TIERS.has(normalized)) {
      return NextResponse.json({ error: "INVALID_TIER" }, { status: 400 });
    }

    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name) { return cookieStore.get(name)?.value; },
          set() {}, remove() {},
        },
      }
    );

    const { data: auth, error: authErr } = await supabase.auth.getUser();
    if (authErr || !auth?.user) {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }
    const user = auth.user;

    const { data: profile, error: profErr } = await supabase
      .from("profiles")
      .select("id, is_admin")
      .eq("id", user.id)
      .single();

    if (profErr) return NextResponse.json({ error: "PROFILE_FETCH_FAILED" }, { status: 500 });

    const isAdmin = !!profile?.is_admin;

    const { data: companion, error: compErr } = await supabase
      .from("companions")
      .select("companion_id, user_id, sub_tier")
      .eq("companion_id", companion_id)
      .single();

    if (compErr || !companion) {
      return NextResponse.json({ error: "COMPANION_NOT_FOUND" }, { status: 404 });
    }

    const isOwner = companion.user_id === user.id;
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const { error: updateErr } = await supabase
      .from("companions")
      .update({ sub_tier: normalized })
      .eq("companion_id", companion_id);

    if (updateErr) {
      return NextResponse.json({ error: "UPDATE_FAILED" }, { status: 500 });
    }

    // Optional history; wrap in try so it never breaks the main flow
    try {
      await supabase
        .from("companion_subscriptions")
        .update({ ended_at: new Date().toISOString() })
        .is("ended_at", null)
        .eq("companion_id", companion_id);

      await supabase.from("companion_subscriptions").insert({
        companion_id,
        sub_tier: normalized,
      });
    } catch (e) {
      console.warn("subscription history write skipped:", e?.message || e);
    }

    return NextResponse.json({ ok: true, companion_id, sub_tier: normalized, was_admin: isAdmin });
  } catch (e) {
    console.error("update-companion-tier error:", e);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
