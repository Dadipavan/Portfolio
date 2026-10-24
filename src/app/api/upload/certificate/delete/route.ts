import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { requireAdmin } from '@/lib/server/session';

const BUCKET = 'certificates';

// Delete a certificate file (admin only). Only plain file names are accepted, never paths.
export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const { fileName } = await request.json();
    if (
      typeof fileName !== 'string' ||
      !/^[A-Za-z0-9_.-]{1,200}$/.test(fileName) ||
      fileName.includes('..')
    ) {
      return NextResponse.json(
        { success: false, error: 'A valid fileName is required' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin.storage.from(BUCKET).remove([fileName]);
    if (error) {
      console.error('Failed to delete certificate file:', error.message);
      return NextResponse.json({ success: false, error: 'Failed to delete file' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Certificate delete route error:', err);
    return NextResponse.json({ success: false, error: 'Delete failed' }, { status: 500 });
  }
}
