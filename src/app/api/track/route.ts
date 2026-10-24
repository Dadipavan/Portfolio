import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { TRACK_EVENTS } from '@/lib/analytics';
import { createRateLimiter, getClientKey, isSameOrigin } from '@/lib/server/rateLimit';
import { LAYOUTS as LOOKS } from '@/lib/siteSettings';

// every look the site offers (so a visit to a newer look is counted too)
const LAYOUTS: string[] = LOOKS.map((look) => look.id);
// a role id is a short slug (the roles are set up in Admin > Roles)
const ROLE_ID = /^[a-z0-9][a-z0-9-]{0,39}$/;
const MISSING_TABLE_CODES = new Set(['42P01', 'PGRST205']);

// 300 events per visitor per hour is far more than a person can produce
const limiter = createRateLimiter(300, 60 * 60 * 1000);

// After one "table missing" answer, skip the database for a few minutes instead of failing on every click
let skipUntil = 0;

// Counts a visit or a click. Stores no personal data, never fails loudly, always answers 204.
export async function POST(request: NextRequest) {
  const empty = () => new NextResponse(null, { status: 204 });

  if (!isSameOrigin(request)) return empty();
  const key = getClientKey(request);
  if (limiter.isLimited(key)) return empty();
  limiter.record(key);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return empty();
  }

  const event = typeof body.event === 'string' ? body.event : '';
  if (!(TRACK_EVENTS as string[]).includes(event)) return empty();

  // Plain text only, short, no control characters
  const target = String(body.target ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim()
    .slice(0, 80);
  const role = ROLE_ID.test(String(body.role)) ? String(body.role) : '';
  const layout = LAYOUTS.includes(String(body.layout)) ? String(body.layout) : '';

  if (Date.now() < skipUntil) return empty();

  const { error } = await supabaseAdmin.from('site_events').insert({ event, target, role, layout });
  if (error && error.code && MISSING_TABLE_CODES.has(error.code))
    skipUntil = Date.now() + 5 * 60 * 1000;
  return empty();
}
