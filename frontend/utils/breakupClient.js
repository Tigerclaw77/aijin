// utils/breakupClient.js
import { supabase } from "./supabaseClient";

export async function sendBreakupRequest(companion_id, method = "sms") {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { success: false, error: "User not authenticated" };
  }

  const destination =
    method === "sms"
      ? user.user_metadata?.phone || user.phone
      : user.email;

  if (!destination) {
    return { success: false, error: "No valid phone/email to send confirmation." };
  }

  const response = await fetch("/api/companions/breakup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      companion_id,
      user_id: user.id,
      method,
      destination,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    return { success: false, error };
  }

  return { success: true };
}
