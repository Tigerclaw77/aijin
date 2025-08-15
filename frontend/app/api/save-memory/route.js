import { supabaseServer } from '../../../../utils/Supabase/supabaseServerClient';

export async function POST(req) {
  try {
    const body = await req.json();

    const {
      user_id = null, // optional
      companion_id,
      message_id,
      content,
      type,
    } = body;

    if (!companion_id || !message_id || !content || !type) {
      return new Response(JSON.stringify({ error: 'Missing required field(s).' }), { status: 400 });
    }

    const { error } = await supabaseServer.from('memories').insert([
      {
        user_id,
        companion_id,
        message_id,
        content,
        type,
      },
    ]);

    if (error) {
      console.error('❌ Error inserting memory:', error);
      return new Response(
        JSON.stringify({
          error: 'Failed to save memory.',
          details: error.message,
        }),
        { status: 500 }
      );
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    return new Response(JSON.stringify({ error: 'Unexpected server error.' }), {
      status: 500,
    });
  }
}
