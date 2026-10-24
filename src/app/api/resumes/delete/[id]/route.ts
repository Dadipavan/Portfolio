import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin, RESUME_BUCKET_SERVER } from '@/lib/supabaseServer';
import { requireAdmin } from '@/lib/server/session';
import { readResumes, writeResumes } from '@/lib/server/resumes';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Resume ID is required' }, { status: 400 });
    }

    const resumes = await readResumes();
    const resume = resumes.find((r) => r.id === id);
    if (!resume) {
      return NextResponse.json({ success: false, error: 'Resume not found' }, { status: 404 });
    }

    // Remove the file first; keep the record if the file could not be removed.
    if (resume.storageType === 'cloud' && resume.cloudFileName) {
      const { error: storageError } = await supabaseAdmin.storage
        .from(RESUME_BUCKET_SERVER)
        .remove([resume.cloudFileName]);

      if (storageError) {
        console.error('Storage deletion failed:', storageError.message);
        return NextResponse.json(
          { success: false, error: 'Failed to delete the stored file' },
          { status: 500 }
        );
      }
    }

    await writeResumes(resumes.filter((r) => r.id !== id));
    revalidatePath('/');
    return NextResponse.json({ success: true, deletedId: id });
  } catch (err) {
    console.error('Delete resume error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
