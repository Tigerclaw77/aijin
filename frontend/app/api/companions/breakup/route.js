// /app/api/companions/breakup/route.js
import { supabase } from "../../../../utils/supabaseClient";
import { sendSMSConfirmation } from "../../../../utils/sendSMSConfirmation";
import { sendEmailConfirmation } from "../../../../utils/sendEmailConfirmation";

export async function POST(req) {
  try {
    const { companion_id, user_id, method, destination } = await req.json();

    if (!companion_id || !user_id || !method || !destination) {
      return new Response("Missing fields", { status: 400 });
    }

    // Step 1: Set status to pending_delete
    const { error: updateError } = await supabase
      .from("companions")
      .update({ status: "pending_delete" })
      .eq("id", companion_id)
      .eq("user_id", user_id);

    if (updateError) throw updateError;

    // Step 2: Trigger confirmation
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store the code in a temporary table or in Supabase auth (skipped here)

    if (method === "sms") {
      await sendSMSConfirmation(destination, code);
    } else {
      await sendEmailConfirmation(destination, code);
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error("Breakup API error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
