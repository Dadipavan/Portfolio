// Browser side of uploading: shrinks big pictures before they are sent, sends a file with a progress report,
// and asks the server to delete files. The server checks every upload again; this is for speed and friendly messages.
import { UPLOAD_RULES, checkUpload, formatBytes, type UploadKind } from './media';
import type { MediaFile } from './types';

export interface PreparedImage {
  file: File;
  width?: number;
  height?: number;
}

// Picture sizes are a trade-off: big enough to look sharp on a large screen, small enough to load quickly
export const IMAGE_LIMITS: Record<UploadKind, { maxSide: number; quality: number }> = {
  photo: { maxSide: 1600, quality: 0.88 },
  project: { maxSide: 2000, quality: 0.9 },
  certificate: { maxSide: 2400, quality: 0.9 },
  achievement: { maxSide: 2000, quality: 0.9 },
  moment: { maxSide: 1600, quality: 0.88 },
};

const SMALL_ENOUGH = 1.2 * 1024 * 1024;

async function decode(
  file: File
): Promise<{
  source: CanvasImageSource;
  width: number;
  height: number;
  close?: () => void;
} | null> {
  try {
    if (typeof createImageBitmap === 'function') {
      const bitmap = await createImageBitmap(file);
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        close: () => bitmap.close(),
      };
    }
  } catch {
    /* fall through to the image element */
  }
  try {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.decoding = 'async';
    image.src = url;
    await image.decode();
    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      close: () => URL.revokeObjectURL(url),
    };
  } catch {
    return null;
  }
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

// Makes a picture smaller when it is large (in pixels or in bytes). PDFs and animated GIFs are left alone.
export async function prepareImage(file: File, kind: UploadKind): Promise<PreparedImage> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return { file };

  const decoded = await decode(file);
  if (!decoded) return { file };

  try {
    const { maxSide, quality } = IMAGE_LIMITS[kind];
    const scale = Math.min(1, maxSide / Math.max(decoded.width, decoded.height));
    if (scale === 1 && file.size <= SMALL_ENOUGH)
      return { file, width: decoded.width, height: decoded.height };

    const width = Math.max(1, Math.round(decoded.width * scale));
    const height = Math.max(1, Math.round(decoded.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) return { file, width: decoded.width, height: decoded.height };
    context.drawImage(decoded.source, 0, 0, width, height);

    const blob =
      (await toBlob(canvas, 'image/webp', quality)) ??
      (await toBlob(canvas, 'image/jpeg', quality));
    // keep the original when shrinking did not help
    if (!blob || (scale === 1 && blob.size >= file.size))
      return { file, width: decoded.width, height: decoded.height };

    const extension = blob.type === 'image/webp' ? 'webp' : 'jpg';
    const name = file.name.replace(/\.[^.]+$/, '') + '.' + extension;
    return { file: new File([blob], name, { type: blob.type }), width, height };
  } finally {
    decoded.close?.();
  }
}

// A quick check before sending, so a wrong file is explained at once
export async function precheck(kind: UploadKind, file: File): Promise<string | null> {
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const result = checkUpload(kind, file.size, head);
  if (result.ok) return null;
  return `${file.name}: ${result.error}`;
}

// Sends one file. `onProgress` receives 0-100 while the bytes travel.
export function uploadMedia(
  kind: UploadKind,
  prepared: PreparedImage,
  onProgress?: (percent: number) => void
): Promise<MediaFile> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.set('kind', kind);
    form.set('file', prepared.file);
    if (prepared.width && prepared.height) {
      form.set('width', String(prepared.width));
      form.set('height', String(prepared.height));
    }

    const request = new XMLHttpRequest();
    request.open('POST', '/api/media/upload');
    request.responseType = 'json';
    request.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress)
        onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
    };
    request.onerror = () =>
      reject(
        new Error('The upload could not reach the server. Check your connection and try again.')
      );
    request.ontimeout = () => reject(new Error('The upload took too long. Try a smaller file.'));
    request.onload = () => {
      const body = request.response as {
        success?: boolean;
        error?: string;
        file?: MediaFile;
      } | null;
      if (request.status >= 200 && request.status < 300 && body?.success && body.file) {
        onProgress?.(100);
        resolve(body.file);
        return;
      }
      if (request.status === 401)
        reject(new Error('Your session has ended. Sign in again and retry.'));
      else if (request.status === 413)
        reject(
          new Error(
            body?.error ??
              `The file is too large (the limit is ${formatBytes(UPLOAD_RULES[kind].maxBytes)}).`
          )
        );
      else reject(new Error(body?.error ?? 'The upload failed. Please try again.'));
    };
    request.timeout = 120_000;
    request.send(form);
  });
}

export interface DeleteResult {
  removed: number;
  skipped: string[];
  error?: string;
}

// Deletes files nothing uses any more. Failures are reported, never thrown: the content is already saved.
export async function deleteMedia(paths: string[]): Promise<DeleteResult> {
  const unique = Array.from(new Set(paths));
  if (unique.length === 0) return { removed: 0, skipped: [] };
  try {
    const response = await fetch('/api/media', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paths: unique }),
    });
    const body = await response.json().catch(() => ({}));
    if (response.ok && body.success)
      return { removed: body.removed ?? 0, skipped: body.skipped ?? [] };
    return { removed: 0, skipped: [], error: body.error ?? 'The files could not be deleted.' };
  } catch {
    return {
      removed: 0,
      skipped: [],
      error: 'The files could not be deleted. Check your connection.',
    };
  }
}
