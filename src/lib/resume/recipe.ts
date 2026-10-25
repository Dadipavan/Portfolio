// What is saved with a built resume so it can be opened again in the builder.
import type { PdfOptions } from './pdf';
import type { BuilderItems, SectionKey } from './source';

export interface ResumeRecipe {
  version: 1;
  // how it was started; older saved resumes do not have it
  mode?: 'own' | 'jd';
  jobTitle: string;
  company: string;
  jd: string;
  items: BuilderItems;
  order: SectionKey[];
  options: Pick<PdfOptions, 'pageSize' | 'fontSize' | 'density'>;
  savedAt: string;
}

export function isRecipe(value: unknown): value is ResumeRecipe {
  const v = value as Partial<ResumeRecipe> | null;
  return !!v && v.version === 1 && typeof v.jd === 'string' && !!v.items && Array.isArray(v.order) && !!v.options;
}

// A file name for the PDF: Resume_Name_Company.pdf
export function pdfFileName(name: string, company: string): string {
  const part = (s: string) => s.trim().replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return ['Resume', part(name), part(company)].filter(Boolean).join('_').slice(0, 80) + '.pdf';
}
