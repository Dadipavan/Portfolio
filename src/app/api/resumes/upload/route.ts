import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin, RESUME_BUCKET_SERVER } from '@/lib/supabaseServer';
import { requireAdmin } from '@/lib/server/session';
import { readResumes, writeResumes, ResumeRecord } from '@/lib/server/resumes';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED: Record<string, string[]> = {
  pdf: ['application/pdf'],
  doc: ['application/msword'],
  docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  txt: ['text/plain'],
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
}

export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const form = await request.formData();
    const file = form.get('file');
    const name = String(form.get('name') ?? '')
      .trim()
      .slice(0, 120);
    const description = String(form.get('description') ?? '')
      .trim()
      .slice(0, 500);

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Resume name is required' },
        { status: 400 }
      );
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File is larger than 10 MB' },
        { status: 400 }
      );
    }

    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (!ALLOWED[ext] || (file.type && !ALLOWED[ext].includes(file.type))) {
      return NextResponse.json(
        { success: false, error: 'Only PDF, DOC, DOCX and TXT files are allowed' },
        { status: 400 }
      );
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    if (ext === 'pdf' && bytes.subarray(0, 5).toString('latin1') !== '%PDF-') {
      return NextResponse.json(
        { success: false, error: 'File is not a valid PDF' },
        { status: 400 }
      );
    }

    const base =
      file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[^a-zA-Z0-9]/g, '_')
        .slice(0, 60) || 'resume';
    const cloudFileName = `${base}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(RESUME_BUCKET_SERVER)
      .upload(cloudFileName, bytes, { contentType: ALLOWED[ext][0], upsert: false });

    if (uploadError) {
      console.error('Resume upload failed:', uploadError.message);
      return NextResponse.json(
        { success: false, error: 'Upload to storage failed' },
        { status: 500 }
      );
    }

    const { data: urlData } = supabaseAdmin.storage
      .from(RESUME_BUCKET_SERVER)
      .getPublicUrl(cloudFileName);

    const resume: ResumeRecord = {
      id: `${Date.now()}${Math.random().toString(36).slice(2, 11)}`,
      name,
      description,
      fileName: file.name,
      fileSize: formatFileSize(file.size),
      fileType: ALLOWED[ext][0],
      uploadDate: new Date().toISOString(),
      cloudFileName,
      cloudUrl: urlData.publicUrl,
      storageType: 'cloud',
      isPublic: false,
    };

    try {
      await writeResumes([...(await readResumes()), resume]);
    } catch (dbError) {
      // Do not leave an orphaned file behind if the record could not be saved
      await supabaseAdmin.storage.from(RESUME_BUCKET_SERVER).remove([cloudFileName]);
      throw dbError;
    }

    revalidatePath('/');
    return NextResponse.json({ success: true, resume });
  } catch (err) {
    console.error('Resume upload route error:', err);
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
  }
}
