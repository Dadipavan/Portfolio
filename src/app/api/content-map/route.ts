import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/server/session';
import { getRawSections } from '@/lib/server/portfolio';
import { buildContentMap } from '@/lib/server/contentMap';

// Admin only: everything stored in the admin panel, and where on the site it appears
export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  const raw = await getRawSections();
  if (!raw) {
    return NextResponse.json(
      { success: false, error: 'Could not load the stored content' },
      { status: 503 }
    );
  }
  return NextResponse.json(
    { success: true, sections: buildContentMap(raw.sections) },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
