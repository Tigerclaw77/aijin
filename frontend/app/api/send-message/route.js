import { NextResponse } from 'next/server';

import { supabaseServer } from '../../../../utils/Supabase/supabaseServerClient.js';
import {
  processVerbalIntimacy,
  processPhysicalIntimacy,
} from '../../../utils/Intimacy/intimacyStateManagerSplit.js';

// Utility to count messages sent today
function countMessagesToday(messages = [], now = new Date()) {
  const today = now.toISOString().split('T')[0];
  return messages.filter((m) => String(m.created_at || '').startsWith(today)).length;
}

// Utility to calculate days since last interaction
function getDaysInactive(lastInteraction) {
  const last = new Date(lastInteraction);
  const now = new Date();
  const diffTime = now - last;
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

// Interaction score could be refined later — for now: 1.0 base
function estimateInteractionScore() {
  return 1.0;
}

export async function POST(req) {
  const { user_id, companion_id, message } = await req.json();

  if (!user_id || !companion_id || !message) {
    return NextResponse.json({ error: 'Missing data' }, { status: 400 });
  }

  // ✅ Step 1: Store message
  const { error: messageError } = await supabaseServer.from('messages').insert([
    {
      user_id,
      companion_id,
      content: message,
    },
  ]);
  if (messageError) {
    return NextResponse.json({ error: 'Failed to save message' }, { status: 500 });
  }

  // ✅ Step 2: Fetch companion data
  const { data: companion, error: companionError } = await supabaseServer
    .from('companions')
    .select('*')
    .eq('companion_id', companion_id) // use companion_id consistently
    .single();

  if (companionError || !companion) {
    return NextResponse.json({ error: 'Companion not found' }, { status: 404 });
  }

  // ✅ Step 3: Fetch recent messages for this companion (only created_at)
  const { data: messagesToday = [] } = await supabaseServer
    .from('messages')
    .select('created_at')
    .eq('companion_id', companion_id);

  const messagesCount = countMessagesToday(messagesToday);

  // ✅ Step 4: Build companionState object
  const now = new Date();
  const companionState = {
    rank: 3, // fallback seed
    isPaused: companion.is_paused ?? false,
    currentIntimacy: companion.verbal_intimacy || 0, // seed; overwritten per stat below
    daysInactive: getDaysInactive(companion.updated_at || companion.created_at || now),
    messagesToday: messagesCount,
    interactionScore: estimateInteractionScore(),
    giftList: [], // pull recent gifts if needed
  };

  // ✅ Step 5: Calculate updated intimacy using your legacy engines
  const updatedVerbal = processVerbalIntimacy({
    ...companionState,
    currentIntimacy: companion.verbal_intimacy || 0,
  });

  const updatedPhysical = processPhysicalIntimacy({
    ...companionState,
    currentIntimacy: companion.physical_intimacy || 0,
  });

  // ✅ Step 6: Save new values
  const { error: updateError } = await supabaseServer
    .from('companions')
    .update({
      verbal_intimacy: updatedVerbal,
      physical_intimacy: updatedPhysical,
      updated_at: now.toISOString(),
    })
    .eq('companion_id', companion_id); // consistent key

  if (updateError) {
    return NextResponse.json({ error: 'Failed to update intimacy' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    verbal_intimacy: updatedVerbal,
    physical_intimacy: updatedPhysical,
  });
}
