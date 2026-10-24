// Server-only helpers for the `resumes` section of portfolio_data.
// The section is stored as a JSON array; older data written by a removed route may be { resumes: [...] }.
import { supabaseAdmin } from '@/lib/supabaseServer';
import { PORTFOLIO_TABLE } from '@/lib/server/sections';

export interface ResumeRecord {
  id: string;
  name: string;
  description: string;
  fileName: string;
  fileSize: string;
  fileType: string;
  uploadDate: string;
  cloudFileName?: string;
  cloudUrl?: string;
  storageType: 'local' | 'cloud';
  isPublic?: boolean;
  [key: string]: unknown;
}

export async function readResumes(): Promise<ResumeRecord[]> {
  const { data, error } = await supabaseAdmin
    .from(PORTFOLIO_TABLE)
    .select('data')
    .eq('section', 'resumes')
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return [];

  const stored = data.data as unknown;
  if (Array.isArray(stored)) return stored as ResumeRecord[];
  if (
    stored &&
    typeof stored === 'object' &&
    Array.isArray((stored as { resumes?: unknown }).resumes)
  ) {
    return (stored as { resumes: ResumeRecord[] }).resumes;
  }
  return [];
}

export async function writeResumes(resumes: ResumeRecord[]): Promise<void> {
  const { error } = await supabaseAdmin
    .from(PORTFOLIO_TABLE)
    .upsert(
      { section: 'resumes', data: resumes, updated_at: new Date().toISOString() },
      { onConflict: 'section' }
    );
  if (error) throw new Error(error.message);
}
