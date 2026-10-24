import { NextRequest, NextResponse } from 'next/server';
import { MEDIA_BUCKET, isMediaPath } from '@/lib/media';
import { forgetPublicFiles, getReferencedFiles } from '@/lib/server/files';
import { requireAdmin } from '@/lib/server/session';
import { supabaseAdmin } from '@/lib/supabaseServer';

// Delete uploaded files (admin only). A file that saved content still uses is never deleted, so a mistake in the
// admin can not break a published page.
export async function DELETE(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  let body: { paths?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }

  const requested = Array.isArray(body.paths) ? body.paths : [];
  const paths = Array.from(new Set(requested.filter(isMediaPath))).slice(0, 50);
  if (paths.length === 0) {
    return NextResponse.json({ success: false, error: 'No valid file was named.' }, { status: 400 });
  }

  const inUse = await getReferencedFiles();
  if (!inUse) {
    return NextResponse.json(
      { success: false, error: 'The saved content could not be read, so nothing was deleted.' },
      { status: 503 }
    );
  }
  const removable = paths.filter((path) => !inUse.has(path));
  const skipped = paths.filter((path) => inUse.has(path));

  if (removable.length > 0) {
    const { error } = await supabaseAdmin.storage.from(MEDIA_BUCKET).remove(removable);
    if (error) {
      console.error('Deleting files failed:', error.message);
      return NextResponse.json(
        { success: false, error: 'The files could not be deleted. Please try again.' },
        { status: 500 }
      );
    }
  }

  forgetPublicFiles();
  return NextResponse.json({ success: true, removed: removable.length, skipped });
}
