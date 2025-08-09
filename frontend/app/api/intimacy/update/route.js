// import { NextResponse } from 'next/server';
// import { createClient } from '@supabase/supabase-js';

// import { superviseIntimacyXP } from '../../../../utils/Intimacy/superviseIntimacyXP';
// import { getIntimacyRank } from '../../../../utils/Intimacy/intimacyRankEngine';

// const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// export async function POST(req) {
//   try {
//     const body = await req.json();
//     const { user_id, companion_id } = body;

//     if (!user_id || !companion_id) {
//       console.error('❌ Missing user_id or companion_id', {
//         user_id,
//         companion_id,
//       });
//       return NextResponse.json(
//         { error: 'Missing user_id or companion_id' },
//         { status: 400, headers: { 'Cache-Control': 'no-store' } }
//       );
//     }

//     const { data: companion, error } = await supabase
//       .from('companions')
//       .select('*')
//       .eq('companion_id', companion_id)
//       .eq('user_id', user_id)
//       .single();

//     if (error || !companion) {
//       console.error('❌ Could not find companion', error);
//       return NextResponse.json(
//         { error: 'Could not fetch companion' },
//         { status: 404, headers: { 'Cache-Control': 'no-store' } }
//       );
//     }

//     const now = new Date();
//     const isoNow = now.toISOString();

//     const verbalDelta = superviseIntimacyXP(companion, 0, 'verbal', now);
//     const physicalDelta = superviseIntimacyXP(companion, 0, 'physical', now);

//     const newVerbalXP = (companion.verbal_xp || 0) + verbalDelta;
//     const newPhysicalXP = (companion.physical_xp || 0) + physicalDelta;

//     let newVerbalRank = getIntimacyRank(newVerbalXP);
//     let newPhysicalRank = getIntimacyRank(newPhysicalXP);

//     // 🧱 Enforce intimacy caps (verbal_intimacy/physical_intimacy are difficulty levels)
//     if (companion.verbal_intimacy === 1 && newVerbalRank >= 2) {
//       newVerbalRank = 1.99;
//     }

//     if (companion.physical_intimacy === 1 && newPhysicalRank >= 2) {
//       newPhysicalRank = 1.99;
//     }

//     const { error: updateError } = await supabase
//       .from('companions')
//       .update({
//         verbal_xp: newVerbalXP,
//         physical_xp: newPhysicalXP,
//         verbal_level: newVerbalRank,
//         physical_level: newPhysicalRank,
//         last_decay_check: isoNow,
//       })
//       .eq('companion_id', companion_id)
//       .eq('user_id', user_id);

//     if (updateError) {
//       console.error('❌ Supabase update error:', updateError);
//       return NextResponse.json(
//         { error: 'Failed to update intimacy' },
//         { status: 500, headers: { 'Cache-Control': 'no-store' } }
//       );
//     }

//     return NextResponse.json(
//       {
//         success: true,
//         verbalDelta,
//         physicalDelta,
//         newVerbalXP,
//         newPhysicalXP,
//         newVerbalRank,
//         newPhysicalRank,
//       },
//       { status: 200, headers: { 'Cache-Control': 'no-store' } }
//     );
//   } catch (err) {
//     console.error('❌ Top-level failure in intimacy update:', err);
//     return NextResponse.json(
//       { error: 'Server error' },
//       { status: 500, headers: { 'Cache-Control': 'no-store' } }
//     );
//   }
// }


import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

import { superviseIntimacyXP } from '../../../../utils/Intimacy/superviseIntimacyXP';
import { getIntimacyRank, getXPThresholdForLevel } from '../../../../utils/Intimacy/intimacyRankEngine';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function POST(req) {
  try {
    const body = await req.json();
    const { user_id, companion_id } = body;

    if (!user_id || !companion_id) {
      console.error('❌ Missing user_id or companion_id', { user_id, companion_id });
      return NextResponse.json(
        { error: 'Missing user_id or companion_id' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    // Fetch companion with user and companion ID
    const { data: companion, error: companionError } = await supabase
      .from('companions')
      .select('*, profiles(subscription_tier)')
      .eq('companion_id', companion_id)
      .eq('user_id', user_id)
      .single();

    if (companionError || !companion) {
      console.error('❌ Could not find companion', companionError);
      return NextResponse.json(
        { error: 'Could not fetch companion' },
        { status: 404, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const now = new Date();
    const isoNow = now.toISOString();

    // Get XP deltas
    const verbalDelta = superviseIntimacyXP(companion, 0, 'verbal', now);
    const physicalDelta = superviseIntimacyXP(companion, 0, 'physical', now);

    const newVerbalXP = (companion.verbal_xp || 0) + verbalDelta;
    const newPhysicalXP = (companion.physical_xp || 0) + physicalDelta;

    // === CAP LOGIC ===

    // Step 1: Get intimacy caps (from companion)
    const intimacyVerbalCap = companion.verbal_intimacy ?? 1;
    const intimacyPhysicalCap = companion.physical_intimacy ?? 1;

    // Step 2: Get subscription-based caps
    const tier = companion.profiles?.subscription_tier?.toLowerCase?.() || 'free';

    const tierCaps = {
      free: 2,
      friend: 3,
      crush: 4,
      girlfriend: 5,
      waifu: 5,
    };

    const tierVerbalCap = tierCaps[tier] ?? 2;
    const tierPhysicalCap = tierCaps[tier] ?? 2;

    // Step 3: Effective caps = min of both
    const effectiveVerbalCap = Math.min(intimacyVerbalCap, tierVerbalCap);
    const effectivePhysicalCap = Math.min(intimacyPhysicalCap, tierPhysicalCap);

    // Step 4: Compute XP limits based on cap
    const maxVerbalXP = getXPThresholdForLevel(effectiveVerbalCap + 1) - 0.0001;
    const maxPhysicalXP = getXPThresholdForLevel(effectivePhysicalCap + 1) - 0.0001;

    // Step 5: Clamp XP to capped limits
    const cappedVerbalXP = Math.min(newVerbalXP, maxVerbalXP);
    const cappedPhysicalXP = Math.min(newPhysicalXP, maxPhysicalXP);

    // Step 6: Convert XP to level
    const newVerbalRank = getIntimacyRank(cappedVerbalXP);
    const newPhysicalRank = getIntimacyRank(cappedPhysicalXP);

    // === UPDATE DATABASE ===
    const { error: updateError } = await supabase
      .from('companions')
      .update({
        verbal_xp: cappedVerbalXP,
        physical_xp: cappedPhysicalXP,
        verbal_level: newVerbalRank,
        physical_level: newPhysicalRank,
        last_decay_check: isoNow,
      })
      .eq('companion_id', companion_id)
      .eq('user_id', user_id);

    if (updateError) {
      console.error('❌ Supabase update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update intimacy' },
        { status: 500, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    return NextResponse.json(
      {
        success: true,
        verbalDelta,
        physicalDelta,
        newVerbalXP: cappedVerbalXP,
        newPhysicalXP: cappedPhysicalXP,
        newVerbalRank,
        newPhysicalRank,
      },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err) {
    console.error('❌ Top-level failure in intimacy update:', err);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
