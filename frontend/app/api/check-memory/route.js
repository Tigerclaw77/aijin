// frontend/app/api/check-memory/route.js

import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '../../../utils/Supabase/supabaseServerClient';

const MEMORY_ON = new Set(['friend', 'crush', 'girlfriend', 'waifu', 'harem']);

export async function POST(req) {
  try {
    const { companion_id } = await req.json();
    if (!companion_id) {
      return NextResponse.json({ memoryEnabled: false, error: 'missing_companion_id' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('companions')
      .select('sub_tier')
      .eq('companion_id', companion_id)
      .maybeSingle();

    if (error) return NextResponse.json({ memoryEnabled: false }, { status: 500 });
    if (!data) return NextResponse.json({ memoryEnabled: false }, { status: 404 });

    const tier = (data.sub_tier || 'free').toString().toLowerCase();
    const memoryEnabled = MEMORY_ON.has(tier);

    return NextResponse.json({ memoryEnabled, tier });
  } catch {
    return NextResponse.json({ memoryEnabled: false }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, endpoint: 'check-memory' });
}
