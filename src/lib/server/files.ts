// Which uploaded files may be shown to visitors. A file is public only while the thing it belongs to is public:
// the profile photo, a published project, a visible certificate, a published achievement.
// Server only.
import { buildContent } from '@/lib/normalize';
import type { MediaFile, PortfolioContent } from '@/lib/types';
import { getRawSections } from '@/lib/server/portfolio';

// Every uploaded file the given content refers to, by storage path
export function collectFiles(content: PortfolioContent): Map<string, MediaFile> {
  const files = new Map<string, MediaFile>();
  const add = (file: MediaFile | undefined) => {
    if (file) files.set(file.path, file);
  };

  add(content.personalInfo.photo?.file);
  content.projects.forEach((project) => (project.media ?? []).forEach(add));
  content.certifications.forEach((certificate) => add(certificate.file));
  content.achievements.forEach((achievement) => (achievement.media ?? []).forEach(add));
  content.moments.forEach((moment) => add(moment.image));
  return files;
}

// Files used by saved content, drafts included (used to refuse deleting a file that is still in use)
export async function getReferencedFiles(): Promise<Map<string, MediaFile> | null> {
  const raw = await getRawSections();
  if (!raw) return null;
  return collectFiles(buildContent(raw.sections, raw.version, { drafts: true }));
}

const TTL_MS = 30_000;
let cached: { at: number; files: Map<string, MediaFile> } | null = null;

// Files visitors may see. Kept for a short while so a page full of images does not read the database for each one.
// Returns null when the content cannot be read, and then nothing is served to visitors.
export async function getPublicFiles(now = Date.now()): Promise<Map<string, MediaFile> | null> {
  if (cached && now - cached.at < TTL_MS) return cached.files;
  const raw = await getRawSections();
  if (!raw) return null;
  const files = collectFiles(buildContent(raw.sections, raw.version));
  cached = { at: now, files };
  return files;
}

export function forgetPublicFiles(): void {
  cached = null;
}
