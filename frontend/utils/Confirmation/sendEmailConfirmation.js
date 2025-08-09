import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function sendEmailConfirmation({
  email,
  companionName,
  confirmationCode,
}) {
  const confirmUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/confirm-delete?code=${confirmationCode}`;

  const { error } = await supabase.functions.invoke("send-email", {
    body: {
      to: email,
      subject: `Confirm breakup with ${companionName}`,
      html: `
        <p>You requested to break up with <strong>${companionName}</strong>.</p>
        <p>Please confirm this action by clicking the link below:</p>
        <p><a href="${confirmUrl}" target="_blank">Confirm breakup</a></p>
        <p>If you did not request this, please ignore this email.</p>
      `,
    },
  });

  if (error) {
    console.error("❌ Failed to send breakup email:", error);
    return false;
  }

  console.log("✅ Breakup confirmation email sent");
  return true;
}
