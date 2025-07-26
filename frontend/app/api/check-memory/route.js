// app/api/check-memory/route.js
import { supabase } from "../../../utils/supabaseClient";

export async function POST(req) {
  try {
    const body = await req.json();
    const { userId, companionId } = body;

    if (!userId) {
      return new Response(JSON.stringify({ memoryEnabled: false }), {
        status: 400,
      });
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("tier")
      .eq("id", userId)
      .single();

    if (error || !profile) {
      console.error("❌ Memory check error:", error);
      return new Response(JSON.stringify({ memoryEnabled: false }), {
        status: 500,
      });
    }

    const memoryEnabled =
      profile.tier === "Waifu" || profile.tier === "Girlfriend";

    return new Response(JSON.stringify({ memoryEnabled }), {
      status: 200,
    });
  } catch (err) {
    console.error("❌ API failure:", err);
    return new Response(JSON.stringify({ memoryEnabled: false }), {
      status: 500,
    });
  }
}
