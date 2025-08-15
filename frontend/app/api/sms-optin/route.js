// /app/api/sms-optin/route.js
import { supabaseServer } from '../../../../utils/Supabase/supabaseServerClient';

export async function POST(req) {
  try {
    const body = await req.json();
    const { phone, companion } = body;

    if (!phone) {
      return new Response('Missing phone', { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from('profiles')
      .update({
        sms_opt_in: true,
        sms_joined_at: new Date().toISOString(),
        companion_name_optin: companion || null,
      })
      .eq('phone', phone)
      .select();

    if (error) {
      console.error(error);
      return new Response('Failed to update opt-in', { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response('Invalid request', { status: 400 });
  }
}
