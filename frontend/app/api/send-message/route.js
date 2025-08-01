// Requirements for Each Route
// Each route will:
// Fetch relevant companion data (joined with messages/gifts if needed)
// Calculate:
// messagesToday
// daysInactive
// giftList
// interactionScore (could default to 1.0 unless more logic)
// Run:
// js
// Copy
// Edit
// const newVerbal = processVerbalIntimacy(companionState);
// const newPhysical = processPhysicalIntimacy(companionState);
// Update Supabase companions table

// app/api/send-message/route.js

import { NextResponse } from 'next/server';
import { supabase } from '../../../utils/supabaseClient';
import { processVerbalIntimacy, processPhysicalIntimacy } from '../../../utils/intimacyStateManagerSplit';

// Utility to count messages sent today
function countMessagesToday(messages = [], now = new Date()) {
  const today = now.toISOString().split('T')[0];
  return messages.filter((msg) => msg.created_at.startsWith(today)).length;
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
  const { error: messageError } = await supabase.from('messages').insert([
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
  const { data: companion, error: companionError } = await supabase
    .from('companions')
    .select('*')
    .eq('id', companion_id)
    .single();

  if (companionError || !companion) {
    return NextResponse.json({ error: 'Companion not found' }, { status: 404 });
  }

  // ✅ Step 3: Fetch recent messages for this companion
  const { data: messagesToday } = await supabase
    .from('messages')
    .select('created_at')
    .eq('companion_id', companion_id);

  const messagesCount = countMessagesToday(messagesToday);

  // ✅ Step 4: Build companionState object
  const now = new Date();
  const companionState = {
    rank: 3, // fallback — or derive from companion.tier if needed
    isPaused: companion.is_paused ?? false,
    currentIntimacy: companion.verbal_intimacy || 0,
    daysInactive: getDaysInactive(companion.updated_at || companion.created_at),
    messagesToday: messagesCount,
    interactionScore: estimateInteractionScore(),
    giftList: [], // TODO: pull recent gifts if needed
  };

  // ✅ Step 5: Calculate updated intimacy
  const updatedVerbal = processVerbalIntimacy({
    ...companionState,
    currentIntimacy: companion.verbal_intimacy || 0,
  });

  const updatedPhysical = processPhysicalIntimacy({
    ...companionState,
    currentIntimacy: companion.physical_intimacy || 0,
  });

  // ✅ Step 6: Save new values
  const { error: updateError } = await supabase
    .from('companions')
    .update({
      verbal_intimacy: updatedVerbal,
      physical_intimacy: updatedPhysical,
      updated_at: now.toISOString(),
    })
    .eq('id', companion_id);

  if (updateError) {
    return NextResponse.json({ error: 'Failed to update intimacy' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    verbal_intimacy: updatedVerbal,
    physical_intimacy: updatedPhysical,
  });
}
