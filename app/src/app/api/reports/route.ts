import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// POST /api/reports  { quakeId, mmi 1-10, note?, place? 0|1, duration? 0-3, moved?: number[], damage? 0-3, lat?, lon?, locale }
export async function POST(req: NextRequest) {
  const b = await req.json();
  const mmi = Number(b.mmi);
  if (!b.quakeId || !(mmi >= 1 && mmi <= 10)) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  const row = {
    quake_id: String(b.quakeId), mmi, note: typeof b.note === 'string' ? b.note.slice(0, 500) : null,
    place: b.place ?? null, duration: b.duration ?? null, moved: Array.isArray(b.moved) ? b.moved.slice(0, 5) : null, damage: b.damage ?? null,
    // Coarsen location to ~10 km to protect privacy.
    lat: Number.isFinite(b.lat) ? Math.round(b.lat * 10) / 10 : null, lon: Number.isFinite(b.lon) ? Math.round(b.lon * 10) / 10 : null,
    locale: String(b.locale ?? 'en').slice(0, 5),
  };
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ ok: true, demo: true });
  const { error } = await createClient(url, key).from('felt_reports').insert(row);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
