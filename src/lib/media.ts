// Uploaded files: where they live, which types and sizes are accepted, and the address the site uses to show them.
// Shared by the browser (admin forms) and the server (upload route, file route). Pure functions, easy to test.
import type { MediaFile } from './types';

// The private storage bucket for everything uploaded in the admin (create it once in Supabase, see DEPLOYMENT.md)
export const MEDIA_BUCKET = 'portfolio-files';

// What an upload is for. Each purpose has its own folder and its own rules.
export type UploadKind = 'photo' | 'project' | 'certificate' | 'achievement' | 'logo';

export const UPLOAD_FOLDERS: Record<UploadKind, string> = {
  photo: 'profile',
  project: 'projects',
  certificate: 'certificates',
  achievement: 'achievements',
  logo: 'logos',
};

const MB = 1024 * 1024;

export interface UploadRules {
  // allowed file types (as detected from the file itself, not from its name)
  types: string[];
  maxBytes: number;
  label: string;
}

const IMAGES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// PDFs stay under 4 MB because the hosting platform (Vercel) refuses request bodies above about 4.5 MB.
// Images are shrunk in the browser before they are sent, so they are normally far smaller than the limit.
export const UPLOAD_RULES: Record<UploadKind, UploadRules> = {
  photo: { types: IMAGES, maxBytes: 4 * MB, label: 'a JPG, PNG, WebP or GIF picture up to 4 MB' },
  project: { types: IMAGES, maxBytes: 4 * MB, label: 'a JPG, PNG, WebP or GIF picture up to 4 MB' },
  certificate: {
    types: [...IMAGES, 'application/pdf'],
    maxBytes: 4 * MB,
    label: 'a picture or a PDF up to 4 MB',
  },
  achievement: {
    types: [...IMAGES, 'application/pdf'],
    maxBytes: 4 * MB,
    label: 'a picture or a PDF up to 4 MB',
  },
  logo: { types: IMAGES, maxBytes: 4 * MB, label: 'a JPG, PNG, WebP or GIF logo up to 4 MB' },
};

export const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'application/pdf': 'pdf',
};

export const isUploadKind = (value: unknown): value is UploadKind =>
  typeof value === 'string' && Object.prototype.hasOwnProperty.call(UPLOAD_FOLDERS, value);

// What the first bytes of a file say it is. A renamed file (for example a script called photo.jpg) is not fooled.
export function sniffFileType(bytes: Uint8Array): { mime: string; ext: string } | null {
  const startsWith = (...signature: number[]) =>
    signature.every((byte, index) => bytes[index] === byte);

  let mime: string | null = null;
  if (startsWith(0xff, 0xd8, 0xff)) mime = 'image/jpeg';
  else if (startsWith(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) mime = 'image/png';
  else if (
    startsWith(0x47, 0x49, 0x46, 0x38) &&
    (bytes[4] === 0x37 || bytes[4] === 0x39) &&
    bytes[5] === 0x61
  )
    mime = 'image/gif';
  else if (
    startsWith(0x52, 0x49, 0x46, 0x46) &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  )
    mime = 'image/webp';
  else if (startsWith(0x25, 0x50, 0x44, 0x46, 0x2d)) mime = 'application/pdf';

  return mime ? { mime, ext: EXTENSIONS[mime] } : null;
}

export type UploadCheck = { ok: true; mime: string; ext: string } | { ok: false; error: string };

// Checks size and real type against the rules of the upload's purpose
export function checkUpload(kind: UploadKind, size: number, head: Uint8Array): UploadCheck {
  const rules = UPLOAD_RULES[kind];
  if (!Number.isFinite(size) || size <= 0) return { ok: false, error: 'The file is empty.' };
  if (size > rules.maxBytes) {
    return {
      ok: false,
      error: `The file is ${(size / MB).toFixed(1)} MB. The limit is ${rules.maxBytes / MB} MB. ${rules.label.replace(/^a /, 'Use a ')}.`,
    };
  }
  const detected = sniffFileType(head);
  if (!detected || !rules.types.includes(detected.mime)) {
    return { ok: false, error: `This kind of file is not accepted here. Use ${rules.label}.` };
  }
  return { ok: true, mime: detected.mime, ext: detected.ext };
}

// "projects/3f2a9c1e-5b7d-4e21-9a8c-0d1f2e3a4b5c.webp"
const PATH_PATTERN =
  /^(profile|projects|certificates|achievements|logos)\/[a-f0-9-]{8,40}\.(jpg|png|webp|gif|pdf)$/;

export const isMediaPath = (value: unknown): value is string =>
  typeof value === 'string' && PATH_PATTERN.test(value);

// The address the site uses to show an uploaded file. The server decides whether to hand it out.
export const mediaUrl = (path: string): string => `/api/media/${path}`;
export const mediaDownloadUrl = (path: string): string => `/api/media/${path}?download=1`;

export const isPdf = (file: Pick<MediaFile, 'mime' | 'path'>): boolean =>
  file.mime === 'application/pdf' || file.path.endsWith('.pdf');

// Older certificates keep their file as a web address; this tells a PDF from a picture by the end of the address
export const isPdfUrl = (url: string): boolean => /\.pdf(?:$|[?#])/i.test(url);

// A file name that is safe to show and to use as a download name
export function cleanFileName(name: string): string {
  // only the last part, if a path was given
  const last = name.split(/[\\/]/).pop() ?? '';
  const base = last
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return (base || 'file').slice(0, 120);
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  if (bytes < MB) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / MB).toFixed(1)} MB`;
}

// Turns whatever is stored for a file into a safe MediaFile, or null when it is not one
export function normaliseMedia(value: unknown): MediaFile | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  if (!isMediaPath(v.path)) return null;
  const number = (n: unknown) =>
    typeof n === 'number' && Number.isFinite(n) && n > 0 ? Math.round(n) : undefined;
  const text = (t: unknown, max: number) =>
    typeof t === 'string' ? t.trim().slice(0, max) : undefined;
  const kinds = ['screenshot', 'chart', 'diagram', 'dashboard', 'photo', 'document'];
  const mime =
    typeof v.mime === 'string' && Object.keys(EXTENSIONS).includes(v.mime) ? v.mime : 'image/jpeg';
  const file: MediaFile = {
    id: typeof v.id === 'string' && v.id ? v.id.slice(0, 60) : v.path.split('/')[1].split('.')[0],
    path: v.path,
    name: cleanFileName(typeof v.name === 'string' ? v.name : 'file'),
    mime,
    size: number(v.size) ?? 0,
  };
  const width = number(v.width);
  const height = number(v.height);
  if (width) file.width = width;
  if (height) file.height = height;
  const caption = text(v.caption, 200);
  const alt = text(v.alt, 200);
  if (caption) file.caption = caption;
  if (alt) file.alt = alt;
  if (typeof v.kind === 'string' && kinds.includes(v.kind)) file.kind = v.kind as MediaFile['kind'];
  return file;
}

export const normaliseMediaList = (value: unknown, limit = 40): MediaFile[] =>
  (Array.isArray(value) ? value : [])
    .map(normaliseMedia)
    .filter((m): m is MediaFile => m !== null)
    .slice(0, limit);
