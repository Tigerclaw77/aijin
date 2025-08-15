import { createClient } from "@supabase/supabase-js";
import { buildIntimacyContext } from "../../../../utils/Intimacy/contextForChat.js";
import { permissionsForRank } from "../../../../utils/Intimacy/permissions.js";

// Service-role server client (envs must be set)
const supabaseServer = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Optional curve params hook (kept for future tuning)
const curves = {
  verbal: {},   // e.g., { alpha: 1, beta: 0 }
  physical: {}, // e.g., { alpha: 1, beta: 0 }
};

// Basic gift-state resolver (override if you track active gift effects)
function getGiftStateForCompanion(/* companion */) {
  return { verbal: false, physical: false };
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { user_id } = body || {};

    if (!user_id) {
      console.log("❌ Missing user_id in request");
      return new Response(JSON.stringify({ error: "Missing user_id" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch all companions for this user (grab columns we use)
    const { data: companions, error } = await supabaseServer
      .from("companions")
      .select(
        [
          "companion_id",
          "user_id",
          "subscription_tier",
          "verbal_xp",
          "physical_xp",
          "verbal_unlocked",
          "physical_unlocked",
          "created_with_verbal1",
          "created_with_physical1",
          "is_paused",
          "last_interaction",
          "messages_today",
          "gifts",
          // legacy/unified fields (compat)
          "intimacy_internal",
          "intimacy_rank",
        ].join(",")
      )
      .eq("user_id", user_id);

    if (error) {
      console.error("❌ Supabase error:", error.message);
      return new Response(JSON.stringify({ error: "Supabase fetch failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!companions || companions.length === 0) {
      return new Response(JSON.stringify({ success: true, updated: 0 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    const nowIso = now.toISOString();
    const updates = [];

    for (const companion of companions) {
      // Build intimacy context from canonical engine
      const giftState = getGiftStateForCompanion(companion);

      // `buildIntimacyContext` expects a pairing-like object;
      // the `companions` row already carries the needed fields.
      const intimacyCtx = buildIntimacyContext({
        pairing: companion,
        giftState,
        curves,
      });

      const { verbal, physical, rankForGating } = intimacyCtx;
      const permissions = permissionsForRank(rankForGating); // available if you want to trigger photo/NSFW, etc.

      // Unified "internal" level as the safer minimum of the two capped levels
      const newInternalLevel = Math.min(verbal.level, physical.level);
      const newRank = rankForGating; // floor(min(levels)), max 5 per engine

      updates.push({
        companion_id: companion.companion_id,
        intimacy_internal: newInternalLevel,
        intimacy_rank: newRank,
        messages_today: 0,
        last_decay_check: nowIso,
        // If you also store per-stat levels/ranks, add them here.
        // verbal_intimacy: verbal.level,
        // physical_intimacy: physical.level,
        // verbal_rank: verbal.rank,
        // physical_rank: physical.rank,
        // Optionally persist derived gating flags from `permissions`
        // can_nsfw: permissions.chat.explicit,
      });
    }

    // Apply updates (one request per row; batch if you prefer)
    const results = await Promise.all(
      updates.map(({ companion_id, ...cols }) =>
        supabaseServer
          .from("companions")
          .update(cols)
          .eq("companion_id", companion_id)
      )
    );

    const failed = results.filter((r) => r.error);
    if (failed.length > 0) {
      console.error(
        "❌ Some updates failed:",
        failed.map((f) => f.error?.message || f.error)
      );
      return new Response(JSON.stringify({ error: "Some updates failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, updated: updates.length }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("❌ Top-level API error:", err);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
