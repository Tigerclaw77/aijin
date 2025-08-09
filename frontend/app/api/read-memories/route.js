import { supabaseServer } from "../../../utils/Supabase/supabaseServerClient";

export async function POST(req) {
  try {
    const {
      companion_id,
      user_id,
      type,
      limit = 100,
      order = "asc",
    } = await req.json();

    if (!companion_id) {
      return Response.json({ error: "Missing companion_id" }, { status: 400 });
    }

    let query = supabaseServer
      .from("memories")
      .select("*")
      .eq("companion_id", companion_id);

    if (user_id) query = query.eq("user_id", user_id);
    if (type) query = query.eq("type", type);

    query = query
      .order("created_at", { ascending: order === "asc" })
      .limit(limit);

    const { data, error } = await query;

    if (error) {
      console.error("❌ Supabase error:", error);
      return Response.json(
        { error: "Failed to read memories", details: error.message },
        { status: 500 }
      );
    }

    return Response.json({ memories: data }, { status: 200 });
  } catch (err) {
    console.error("❌ Server error:", err);
    return Response.json(
      { error: "Internal server error", details: err.message },
      { status: 500 }
    );
  }
}
