import { NextRequest, NextResponse } from 'next/server';
import {
  MEDIA_BUCKET,
  UPLOAD_FOLDERS,
  UPLOAD_RULES,
  checkUpload,
  cleanFileName,
  isUploadKind,
} from '@/lib/media';
import { requireAdmin } from '@/lib/server/session';
import { supabaseAdmin } from '@/lib/supabaseServer';

const dimension = (value: FormDataEntryValue | null): number | undefined => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 1 && n <= 20000 ? Math.round(n) : undefined;
};

// Upload an image or a PDF for the profile, a project, a certificate or an achievement (admin only).
// The server checks the size and the real type of the file; the file name is never used to store it.
export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { success: false, error: 'The upload could not be read.' },
      { status: 400 }
    );
  }

  const kind = form.get('kind');
  const file = form.get('file');
  if (!isUploadKind(kind)) {
    return NextResponse.json({ success: false, error: 'Unknown kind of upload.' }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ success: false, error: 'No file was sent.' }, { status: 400 });
  }
  if (file.size > UPLOAD_RULES[kind].maxBytes) {
    const mb = UPLOAD_RULES[kind].maxBytes / (1024 * 1024);
    return NextResponse.json(
      {
        success: false,
        error: `The file is ${(file.size / (1024 * 1024)).toFixed(1)} MB. The limit is ${mb} MB.`,
      },
      { status: 413 }
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const check = checkUpload(kind, bytes.byteLength, bytes.subarray(0, 16));
  if (!check.ok) {
    return NextResponse.json({ success: false, error: check.error }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const path = `${UPLOAD_FOLDERS[kind]}/${id}.${check.ext}`;

  const { error } = await supabaseAdmin.storage
    .from(MEDIA_BUCKET)
    .upload(path, bytes, { contentType: check.mime, upsert: false, cacheControl: '31536000' });

  if (error) {
    console.error('Upload to storage failed:', error.message);
    const missing = /bucket not found/i.test(error.message);
    return NextResponse.json(
      {
        success: false,
        error: missing
          ? `The storage bucket "${MEDIA_BUCKET}" does not exist yet. Create it in Supabase (see the deployment guide) and try again.`
          : 'The file could not be stored. Please try again.',
      },
      { status: missing ? 503 : 500 }
    );
  }

  const width = dimension(form.get('width'));
  const height = dimension(form.get('height'));
  return NextResponse.json({
    success: true,
    file: {
      id,
      path,
      name: cleanFileName(file.name),
      mime: check.mime,
      size: bytes.byteLength,
      ...(width && height ? { width, height } : {}),
    },
  });
}
