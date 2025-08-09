// backend/api/receive-sms.js

import { NextResponse } from "next/server";
import { createClient } from "@supabaseServer/supabaseServer-js";

// Disable body parsing for raw Twilio payload
export const config = {
  api: {
    bodyParser: false,
  },
};

// Supabase server client (service role needed for inserts)
const supabaseServer = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const body = await req.text();
    const params = new URLSearchParams(body);

    const from = params.get("From"); // User's phone
    const to = params.get("To"); // Your Twilio number
    const bodyText = params.get("Body");

    console.log("📩 Received SMS:", { from, to, bodyText });

    // Lookup companion by your Twilio number
    const { data: companions, error } = await supabaseServer
      .from("companions")
      .select("id")
      .eq("twilio_number", to)
      .limit(1);

    if (error || !companions?.length) {
      console.warn("⚠️ No companion found for number:", to);
    } else {
      const companion_id = companions[0].id;

      // Insert incoming message
      const { error: insertError } = await supabaseServer
        .from("messages")
        .insert({
          companion_id,
          direction: "incoming",
          message: bodyText,
          sender_number: from,
          receiver_number: to,
          created_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error("🛑 Error saving message:", insertError.message);
      } else {
        console.log("✅ Message saved to Supabase");
      }
    }

    // (Optional) Generate reply text here — static for now
    const replyText = `Hello! You said: "${bodyText}". We'll talk soon! ❤️`;

    const xmlResponse = `
      <Response>
        <Message>${replyText}</Message>
      </Response>
    `.trim();

    return new Response(xmlResponse, {
      headers: { "Content-Type": "text/xml" },
    });
  } catch (error) {
    console.error("🛑 SMS receive error:", error);
    return new Response("Error", { status: 500 });
  }
}
