import { createClient } from "@supabase/supabase-js";
import { processDailyIntimacy } from "../../../../utils/intimacyStateManagerUnified";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const body = await req.json();
    const { user_id } = body;

    if (!user_id) {
      console.log("❌ Missing user_id in request");
      return new Response(JSON.stringify({ error: "Missing user_id" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: companions, error } = await supabase
      .from("companions")
      .select("*")
      .eq("user_id", user_id);

    if (error) {
      console.error("❌ Supabase error:", error.message);
      return new Response(JSON.stringify({ error: "Supabase fetch failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    const updates = [];

    for (const companion of companions) {
      const lastInteraction = companion.last_interaction
        ? new Date(companion.last_interaction)
        : new Date(now.getTime() - 86400000); // fallback 1 day ago

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

      updates.push({
        companion_id: companion.companion_id,
        intimacy_internal: newIntimacy,
      });
    }

    const updatePromises = updates.map(({ companion_id, intimacy_internal }) =>
      supabase
        .from("companions")
        .update({
          intimacy_internal,
          last_decay_check: now.toISOString(),
          messages_today: 0,
        })
        .eq("companion_id", companion_id)
    );

    const results = await Promise.all(updatePromises);
    const failed = results.filter((r) => r.error);

    if (failed.length > 0) {
      console.error(
        "❌ Some updates failed:",
        failed.map((f) => f.error)
      );
      return new Response(JSON.stringify({ error: "Some updates failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ success: true, updated: updates.length }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("❌ Top-level API error:", err);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
