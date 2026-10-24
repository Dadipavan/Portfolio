import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { requireAdmin } from '@/lib/server/session';

const BUCKET = 'certificates';
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  pdf: 'application/pdf',
};

// Upload a certificate image/PDF (admin only)
export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const form = await request.formData();
    const file = form.get('file');

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File is larger than 5 MB' },
        { status: 400 }
      );
    }

    const ext = (file.name.split('.').pop() || '').toLowerCase();
    const contentType = ALLOWED_TYPES[ext];
    if (!contentType) {
      return NextResponse.json(
        { success: false, error: 'Only PNG, JPG, WEBP and PDF files are allowed' },
        { status: 400 }
      );
    }

    const base =
      file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[^a-zA-Z0-9]/g, '_')
        .slice(0, 60) || 'certificate';
    const uniqueName = `${base}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(uniqueName, Buffer.from(await file.arrayBuffer()), { contentType, upsert: false });

    if (uploadError) {
      console.error('Certificate upload failed:', uploadError.message);
      return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
    }

    const { data: urlData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(uniqueName);
    return NextResponse.json({ success: true, fileName: uniqueName, publicUrl: urlData.publicUrl });
  } catch (err) {
    console.error('Certificate upload route error:', err);
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
  }
}
