import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { requireAdmin } from '@/lib/server/session';
import { PORTFOLIO_TABLE, isPortfolioSection, isValidSectionPayload } from '@/lib/server/sections';

export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const section = new URL(request.url).searchParams.get('section');
    if (!isPortfolioSection(section)) {
      return NextResponse.json(
        { success: false, error: 'Unknown or missing section' },
        { status: 400 }
      );
    }

    const body = await request.json();
    if (!isValidSectionPayload(body)) {
      return NextResponse.json({ success: false, error: 'Invalid data' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from(PORTFOLIO_TABLE)
      .upsert(
        { section, data: body, updated_at: new Date().toISOString() },
        { onConflict: 'section' }
      );

    if (error) {
      console.error('Database error updating section:', error.message);
      return NextResponse.json(
        { success: false, error: 'Failed to update portfolio section' },
        { status: 500 }
      );
    }

    revalidatePath('/');
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Update section failed:', err);
    return NextResponse.json({ success: false, error: 'Update failed' }, { status: 500 });
  }
}
