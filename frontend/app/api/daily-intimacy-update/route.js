import { NextResponse } from 'next/server';

// Shared server-side Supabase client (moved to shared/)
import { supabaseServer } from '../../../../utils/Supabase/supabaseServerClient.js';

// Canonical Intimacy helpers
import { computeStatState } from '../../../utils/Intimacy/intimacyUpdate.js';
import { permissionsForRank } from '../../../utils/Intimacy/permissions.js';

/** Days between now and a timestamp */
function getDaysInactive(updatedAt) {
  const last = new Date(updatedAt);
  const now = new Date();
  const diffTime = now - last;
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Optional: plug your real curve params here.
 * Keeping placeholders so computeStatState signature remains future-proof.
 */
const curves = {
  verbal: {}, // e.g., { alpha: 1, beta: 0 }
  physical: {}, // e.g., { alpha: 1, beta: 0 }
};

/**
 * Optional: pull gift effects if you track time-limited boosts.
 * For now, default to no active gifts in a daily job.
 */
function getGiftStateForCompanion(/* companion */) {
  return { verbal: false, physical: false };
}

export async function GET() {
  const nowIso = new Date().toISOString();

  // 1) Fetch companions (only columns we actually use)
  const { data: companions, error } = await supabaseServer.from('companions').select(
    [
      'companion_id',
      'subscription_tier', // sub_tier for caps
      'verbal_xp',
      'physical_xp', // XP inputs to the curve
      'verbal_unlocked',
      'physical_unlocked',
      'created_with_verbal1',
      'created_with_physical1',
      'is_paused',
      'updated_at',
      'created_at',
    ].join(',')
  );

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch companions', details: error.message },
      { status: 500 }
    );
  }

  if (!companions || companions.length === 0) {
    return NextResponse.json({ updated: 0, note: 'No companions found' });
  }

  const updates = [];

  for (const c of companions) {
    const daysInactive = getDaysInactive(c.updated_at || c.created_at || new Date().toISOString());

    // If you want to pause decay/growth for paused companions, you can early-continue here.
    const isPaused = !!c.is_paused;
    if (isPaused) {
      // Optionally skip updating paused rows beyond updating the timestamp
      // updates.push({ companion_id: c.companion_id, verbal_intimacy: c.verbal_intimacy, physical_intimacy: c.physical_intimacy });
      // continue;
    }

    const giftState = getGiftStateForCompanion(c);

    // Nun-locks are true iff user created the stat at 1 AND it has not been unlocked
    const nunLockedVerbal = !!(c.created_with_verbal1 && !c.verbal_unlocked);
    const nunLockedPhysical = !!(c.created_with_physical1 && !c.physical_unlocked);

    // Compute state for each stat from XP using canonical engine
    const verbalState = computeStatState({
      xp: Number(c.verbal_xp) || 0,
      curveParams: curves.verbal,
      sub_tier: c.subscription_tier,
      giftActive: !!giftState.verbal,
      nunLocked: nunLockedVerbal,
    });

    const physicalState = computeStatState({
      xp: Number(c.physical_xp) || 0,
      curveParams: curves.physical,
      sub_tier: c.subscription_tier,
      giftActive: !!giftState.physical,
      nunLocked: nunLockedPhysical,
    });

    // If you need permissions for downstream triggers, you can combine ranks here:
    const rankForGating = Math.min(verbalState.rank, physicalState.rank);
    const permissions = permissionsForRank(rankForGating);

    // Prepare DB update payload (we store the capped LEVEL as `*_intimacy`)
    updates.push({
      companion_id: c.companion_id,
      verbal_intimacy: verbalState.level, // float level after caps
      physical_intimacy: physicalState.level,
      // Optional: persist ranks if you have columns for them
      // verbal_rank: verbalState.rank,
      // physical_rank: physicalState.rank,
      // Optional: store permissions snapshot or derived flags
      // can_nsfw: permissions.chat.explicit,
    });
  }

  // 2) Apply updates (one by one; you can batch if you prefer)
  for (const u of updates) {
    const { error: upErr } = await supabaseServer
      .from('companions')
      .update({
        verbal_intimacy: u.verbal_intimacy,
        physical_intimacy: u.physical_intimacy,
        updated_at: nowIso,
      })
      .eq('companion_id', u.companion_id);

    if (upErr) {
      // You can collect failed ids if you want detailed reporting
      console.error('Update failed for companion_id', u.companion_id, upErr.message);
    }
  }

  return NextResponse.json({ updated: updates.length });
}
