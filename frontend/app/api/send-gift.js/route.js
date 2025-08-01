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

// app/api/send-gift/route.js

import { NextResponse } from 'next/server';
import { supabase } from '../../../utils/supabaseClient';
import { processVerbalIntimacy, processPhysicalIntimacy } from '../../../utils/intimacyStateManagerSplit';
import { getGiftEffectList } from '../../../utils/giftUtils'; // Assumes you have a central gift registry

export async function POST(req) {
  const { user_id, companion_id, gift_id } = await req.json();

  if (!user_id || !companion_id || !gift_id) {
    return NextResponse.json({ error: 'Missing data' }, { status: 400 });
  }

  const now = new Date();

  // ✅ Step 1: Record gift
  const { error: giftError } = await supabase.from('gifts').insert([
    {
      user_id,
      companion_id,
      gift_id,
      given_at: now.toISOString(),
    },
  ]);

  if (giftError) {
    return NextResponse.json({ error: 'Failed to record gift' }, { status: 500 });
  }

  // ✅ Step 2: Get companion info
  const { data: companion, error: companionError } = await supabase
    .from('companions')
    .select('*')
    .eq('id', companion_id)
    .single();

  if (companionError || !companion) {
    return NextResponse.json({ error: 'Companion not found' }, { status: 404 });
  }

  // ✅ Step 3: Load effect of the gift
  const giftList = getGiftEffectList([{ id: gift_id, given_at: now }]); // Normalize structure

  // ✅ Step 4: Prepare state
  const companionState = {
    rank: 3,
    isPaused: companion.is_paused ?? false,
    daysInactive: 0,
    messagesToday: 0,
    interactionScore: 1.0,
    giftList,
  };

  const updatedVerbal = processVerbalIntimacy({
    ...companionState,
    currentIntimacy: companion.verbal_intimacy || 0,
  });

  const updatedPhysical = processPhysicalIntimacy({
    ...companionState,
    currentIntimacy: companion.physical_intimacy || 0,
  });

  // ✅ Step 5: Save to Supabase
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
    updatedVerbalIntimacy: updatedVerbal,
    updatedPhysicalIntimacy: updatedPhysical,
  });
}
