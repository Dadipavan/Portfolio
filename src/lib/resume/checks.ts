// Plain-language ATS checks on the finished document.
import type { PersonalInfo } from '@/lib/types';
import type { DocBlock } from './pdf';
import { toPdfText } from './pdf';
import { blocksText } from './source';

export interface Check {
  id: string;
  level: 'ok' | 'warn' | 'bad';
  text: string;
}

export function runChecks(personal: PersonalInfo, blocks: DocBlock[], pages: number): Check[] {
  const checks: Check[] = [];
  const add = (id: string, level: Check['level'], text: string) => checks.push({ id, level, text });

  if (!personal?.name?.trim()) add('name', 'bad', 'Your name is missing. Add it in Admin > Personal.');
  const missing = [!personal?.email && 'email', !personal?.phone && 'phone', !personal?.location && 'location'].filter(Boolean);
  if (missing.length) add('contact', 'warn', `Contact details missing: ${missing.join(', ')}. Recruiters and ATS expect them.`);
  else add('contact', 'ok', 'Name, email, phone and location are in the header.');

  if (pages <= 1) add('pages', 'ok', 'Fits on one page.');
  else if (pages === 2) add('pages', 'warn', 'Two pages. Fine with 5+ years; otherwise turn off a few lines to fit one.');
  else add('pages', 'bad', `${pages} pages is too long. Turn off older or weaker items.`);

  const bullets = blocks.filter((b): b is Extract<DocBlock, { kind: 'bullet' }> => b.kind === 'bullet');
  const texts = bullets.map((b) => b.runs.map((r) => r.text).join(''));
  if (texts.length) {
    const withNumbers = texts.filter((t) => /\d/.test(t)).length;
    const pct = Math.round((withNumbers / texts.length) * 100);
    if (pct >= 30) add('numbers', 'ok', `${pct}% of the bullets contain a number or result.`);
    else add('numbers', 'warn', `Only ${pct}% of the bullets contain a number. Add counts, percentages or sizes where they are true.`);
    const long = texts.filter((t) => t.length > 230).length;
    if (long) add('long', 'warn', `${long} bullet${long > 1 ? 's are' : ' is'} very long (over 230 characters). Two lines is the usual limit.`);
  } else {
    add('bullets', 'warn', 'No bullet points yet. Experience and projects read best as short bullets.');
  }

  const all = blocksText(blocks);
  const lost = Array.from(new Set(Array.from(all).filter((ch) => ch !== '\n' && toPdfText(ch) !== ch && ch.trim() !== '')));
  if (lost.length) add('chars', 'warn', `These characters cannot be written to the PDF and will be replaced or dropped: ${lost.slice(0, 8).join(' ')}`);

  if (!blocks.some((b) => b.kind === 'heading' && b.text === 'Experience') && !blocks.some((b) => b.kind === 'heading' && b.text === 'Projects')) {
    add('sections', 'warn', 'Neither Experience nor Projects is included.');
  }
  add('format', 'ok', 'Single column, real text, standard headings, no tables, icons or images.');
  return checks;
}
