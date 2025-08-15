import { supabaseServer } from '../../../../../utils/Supabase/supabaseServerClient';
import { logCompanionArchive } from '../../../../utils/Companion/logCompanionArchive';

export async function POST(req) {
  try {
    const { companion_id, user_id, confirmationCode } = await req.json();

    if (!companion_id || !user_id || !confirmationCode) {
      return new Response('Missing fields', { status: 400 });
    }

    // ✅ TODO: Validate confirmationCode (stubbed)
    const isValid = true; // Replace with real lookup in future
    if (!isValid) {
      return new Response('Invalid confirmation code', { status: 403 });
    }

    // ✅ Get current companion data
    const { data: companion, error: fetchError } = await supabaseServer
      .from('companions')
      .select('*')
      .eq('id', companion_id)
      .eq('user_id', user_id)
      .single();

    if (fetchError) throw fetchError;
    if (!companion) return new Response('Not found', { status: 404 });

    // ✅ Step 1: Archive current data
    await logCompanionArchive(companion);

    // ✅ Step 2: Update status
    const { error: updateError } = await supabaseServer
      .from('companions')
      .update({ status: 'deleted' })
      .eq('id', companion_id)
      .eq('user_id', user_id);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error('Confirm Delete API error:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
}
