import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { processDailyIntimacy } from "../../../../utils/intimacyStateManagerUnified";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const body = await req.json();
    const { user_id, companion_id } = body;

    if (!user_id || !companion_id) {
      console.error("❌ Missing user_id or companion_id", { user_id, companion_id });
      return NextResponse.json(
        { error: "Missing user_id or companion_id" },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    const { data: companion, error } = await supabase
      .from("companions")
      .select("*")
      .eq("companion_id", companion_id)
      .eq("user_id", user_id)
      .maybeSingle();

    if (error || !companion) {
      console.error("❌ Could not find companion", error);
      return NextResponse.json(
        { error: "Could not fetch companion" },
        { status: 404, headers: { "Cache-Control": "no-store" } }
      );
    }

    const now = new Date();
    const isoNow = now.toISOString();

    const lastInteraction = companion.last_interaction
      ? new Date(companion.last_interaction)
      : new Date(now.getTime() - 86400000); // 1 day ago fallback

    const daysInactive = Math.floor(
      (now - lastInteraction) / (1000 * 60 * 60 * 24)
    );

    const companionState = {
      rank: companion.intimacy_rank,
      currentIntimacy: companion.intimacy_internal,
      isPaused: companion.is_paused,
      daysInactive,
      messagesToday: companion.messages_today || 0,
      interactionScore: 1.0,
      giftList: companion.gifts || [],
    };

    const newIntimacy = processDailyIntimacy(companionState, now);

    if (typeof newIntimacy !== "number" || newIntimacy < 0) {
      console.error("❌ Invalid intimacy value computed:", newIntimacy);
      return NextResponse.json(
        { error: "Invalid intimacy result" },
        { status: 500, headers: { "Cache-Control": "no-store" } }
      );
    }

    console.log("🧠 New intimacy value:", newIntimacy);
    console.log("📝 Companion before update:", {
      companion_id,
      user_id,
      intimacy_internal: newIntimacy,
      last_decay_check: isoNow,
      messages_today: 0,
    });

    const { error: updateError } = await supabase
      .from("companions")
      .update({
        intimacy_internal: newIntimacy,
        last_decay_check: isoNow,
        messages_today: 0,
      })
      .eq("companion_id", companion_id)
      .eq("user_id", user_id);

    if (updateError) {
      console.error("❌ Supabase update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update intimacy" },
        { status: 500, headers: { "Cache-Control": "no-store" } }
      );
    }

    return NextResponse.json(
      { success: true, newIntimacy },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("❌ Top-level failure in intimacy update:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
