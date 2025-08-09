import { NextResponse } from 'next/server';

import { supabaseServer } from '../../../utils/Supabase/supabaseServerClient';
import {
  processVerbalIntimacy,
  processPhysicalIntimacy,
} from '../../../utils/Intimacy/intimacyStateManagerSplit';

function getDaysInactive(updatedAt) {
  const last = new Date(updatedAt);
  const now = new Date();
  const diffTime = now - last;
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

export async function GET() {
  const now = new Date();

  // ✅ Step 1: Fetch all companions (or limit to recent users later)
  const { data: companions, error } = await supabaseServer.from('companions').select('*');

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch companions' }, { status: 500 });
  }

  const updates = [];

  for (const companion of companions) {
    const companionState = {
      rank: 3,
      isPaused: companion.is_paused ?? false,
      daysInactive: getDaysInactive(companion.updated_at || companion.created_at),
      messagesToday: 0,
      interactionScore: 1.0,
      giftList: [],
    };

    const updatedVerbal = processVerbalIntimacy({
      ...companionState,
      currentIntimacy: companion.verbal_intimacy || 0,
    });

    const updatedPhysical = processPhysicalIntimacy({
      ...companionState,
      currentIntimacy: companion.physical_intimacy || 0,
    });

    updates.push({
      id: companion.companion_id,
      verbal_intimacy: updatedVerbal,
      physical_intimacy: updatedPhysical,
    });
  }

  // ✅ Step 2: Apply batch updates (can optimize further later)
  for (const update of updates) {
    await supabaseServer
      .from('companions')
      .update({
        verbal_intimacy: update.verbal_intimacy,
        physical_intimacy: update.physical_intimacy,
        updated_at: now.toISOString(),
      })
      .eq('companion_id', update.companion_id);
  }

  return NextResponse.json({ updated: updates.length });
}
