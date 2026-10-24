// Server-only loader for the public portfolio content.
import { cache } from 'react';
import { buildContent } from '@/lib/normalize';
import type { PortfolioContent } from '@/lib/types';

export { toPublicResumes } from '@/lib/normalize';

// Cached per request so metadata and the page share one database round trip.
export const getPublicPortfolio = cache(async (): Promise<PortfolioContent> => {
  try {
    const { supabaseAdmin } = await import('@/lib/supabaseServer');
    const { data, error } = await supabaseAdmin
      .from('portfolio_data')
      .select('section, data, updated_at');
    if (error || !data || data.length === 0) {
      if (error) console.error('Portfolio load failed, using built-in content:', error.message);
      return buildContent({});
    }

    const sections = Object.fromEntries(data.map((row) => [row.section, row.data]));
    const version = data.reduce(
      (latest, row) =>
        row.updated_at && row.updated_at > latest ? String(row.updated_at) : latest,
      ''
    );
    return buildContent(sections, version);
  } catch (err) {
    console.error(
      'Portfolio load failed, using built-in content:',
      err instanceof Error ? err.message : err
    );
    return buildContent({});
  }
});

// Raw stored sections (used by the admin tools that compare what is stored with what is shown)
export async function getRawSections(): Promise<{
  sections: Record<string, unknown>;
  version: string;
} | null> {
  try {
    const { supabaseAdmin } = await import('@/lib/supabaseServer');
    const { data, error } = await supabaseAdmin
      .from('portfolio_data')
      .select('section, data, updated_at');
    if (error || !data) return null;
    return {
      sections: Object.fromEntries(data.map((row) => [row.section, row.data])),
      version: data.reduce(
        (latest, row) =>
          row.updated_at && row.updated_at > latest ? String(row.updated_at) : latest,
        ''
      ),
    };
  } catch {
    return null;
  }
}
