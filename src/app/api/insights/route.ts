import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { requireAdmin } from '@/lib/server/session';
import { summariseEvents, type EventRow } from '@/lib/server/insights';

const MISSING_TABLE_CODES = new Set(['42P01', 'PGRST205']);

// Admin only: visit counts for Admin > Insights
export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  const requested = Number(new URL(request.url).searchParams.get('days'));
  const days = [7, 30, 90].includes(requested) ? requested : 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabaseAdmin
    .from('site_events')
    .select('created_at, event, target, role, layout')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(20000);

  if (error) {
    const missing = Boolean(error.code && MISSING_TABLE_CODES.has(error.code));
    return NextResponse.json(
      {
        success: false,
        setupRequired: missing,
        error: missing ? 'The site_events table does not exist yet' : 'Failed to load insights',
      },
      { status: missing ? 503 : 500 }
    );
  }

  return NextResponse.json(
    { success: true, ...summariseEvents((data ?? []) as EventRow[], days) },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
