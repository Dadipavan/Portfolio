import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, RESUME_BUCKET_SERVER } from '@/lib/supabaseServer';
import { requireAdmin } from '@/lib/server/session';

// Admin only: lists every file in the resume bucket (used by "import from cloud" in the admin panel).
export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const { data, error } = await supabaseAdmin.storage.from(RESUME_BUCKET_SERVER).list('', {
      limit: 100,
      offset: 0,
      sortBy: { column: 'created_at', order: 'desc' },
    });

    if (error) {
      console.error('Supabase list error:', error.message);
      return NextResponse.json(
        { success: false, error: `Failed to list files: ${error.message}` },
        { status: 500 }
      );
    }

    const files = (data || [])
      .filter((f) => f.name && !f.name.endsWith('/') && !f.name.startsWith('.'))
      .map((f) => ({
        name: f.name,
        id: f.id || f.name,
        size: f.metadata?.size || 0,
        mimeType: f.metadata?.mimetype || 'application/octet-stream',
        createdAt: f.created_at || f.updated_at || new Date().toISOString(),
        publicUrl: supabaseAdmin.storage.from(RESUME_BUCKET_SERVER).getPublicUrl(f.name).data
          .publicUrl,
      }));

    return NextResponse.json({
      success: true,
      files,
      total: files.length,
      bucket: RESUME_BUCKET_SERVER,
    });
  } catch (err) {
    console.error('List resumes failed:', err);
    return NextResponse.json({ success: false, error: 'Failed to list files' }, { status: 500 });
  }
}
