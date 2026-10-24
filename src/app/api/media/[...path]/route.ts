import { NextRequest, NextResponse } from 'next/server';
import { MEDIA_BUCKET, isMediaPath } from '@/lib/media';
import { getPublicFiles } from '@/lib/server/files';
import { isAdminRequest } from '@/lib/server/session';
import { supabaseAdmin } from '@/lib/supabaseServer';

const SIGNED_URL_SECONDS = 600;

const notFound = () =>
  new NextResponse('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } });

// Shows an uploaded file. Files live in a private bucket, so this route checks that the file belongs to something
// public (or that the admin is signed in), then sends the browser to a short-lived link straight from storage.
export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params;
  const path = (segments ?? []).join('/');
  if (!isMediaPath(path)) return notFound();

  const admin = isAdminRequest(request);
  let downloadName: string | true | undefined;
  const wantsDownload = new URL(request.url).searchParams.get('download') !== null;

  if (!admin) {
    const files = await getPublicFiles();
    const file = files?.get(path);
    if (!file) return notFound();
    if (wantsDownload) downloadName = file.name;
  } else if (wantsDownload) {
    downloadName = true;
  }

  const { data, error } = await supabaseAdmin.storage
    .from(MEDIA_BUCKET)
    .createSignedUrl(path, SIGNED_URL_SECONDS, downloadName ? { download: downloadName } : undefined);
  if (error || !data?.signedUrl) {
    if (error) console.error('Could not sign a file link:', error.message);
    return notFound();
  }

  return NextResponse.redirect(data.signedUrl, {
    status: 302,
    headers: {
      // a signed link lasts ten minutes, so the redirect may be reused for a shorter time
      'Cache-Control': admin ? 'private, no-store' : 'public, max-age=240, s-maxage=240',
    },
  });
}
