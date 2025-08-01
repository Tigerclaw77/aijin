import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Memory levels mapped by tier
const MEMORY_STORAGE = {
  Sample: "volatile",
  Free: "jsonb",
  Crush: "jsonb",
  Friend: "jsonb",
  Girlfriend: "blocks",
  Waifu: "blocks",
};

export async function POST(req) {
  try {
    console.log("📥 check-memory called");

    const body = await req.json();
    const { companion_id } = body;

    if (!companion_id) {
      console.warn("⚠️ check-memory: Missing companion_id in request body");
      return new Response(JSON.stringify({ memoryEnabled: false }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      });
    }

    const { data: companion, error } = await supabase
      .from("companions")
      .select("tier")
      .eq("companion_id", companion_id)
      .maybeSingle();

    if (error) {
      console.error("❌ Supabase error:", error.message);
      return new Response(JSON.stringify({ memoryEnabled: false }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      });
    }

    if (!companion) {
      console.warn("⚠️ No companion found for ID:", companion_id);
      return new Response(JSON.stringify({ memoryEnabled: false }), {
        status: 404,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      });
    }

    const memoryLevel = MEMORY_STORAGE[companion.tier] || "volatile";
    const memoryEnabled = memoryLevel !== "volatile";

    return new Response(JSON.stringify({ memoryEnabled, memoryLevel }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("❌ check-memory: Top-level failure:", err);
    return new Response(JSON.stringify({ memoryEnabled: false }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  }
}
