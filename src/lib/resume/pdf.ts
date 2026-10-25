// A small, dependency-free PDF writer for text-only, ATS-friendly resumes.
// It uses the built-in Helvetica fonts (no embedding), real text (never images) and one column, so
// every applicant tracking system can read it. Layout is shared with the on-screen preview through
// the `DocBlock` model below.

export interface Run {
  text: string;
  bold?: boolean;
  url?: string;
}

export type DocBlock =
  | { kind: 'name'; text: string }
  | { kind: 'contact'; runs: Run[] }
  | { kind: 'heading'; text: string }
  // a title on the left and a date on the right, with an optional second line (company, school)
  | { kind: 'entry'; left: string; right?: string; sub?: string; subRight?: string }
  | { kind: 'bullet'; runs: Run[] }
  | { kind: 'text'; runs: Run[] };

export type PageSize = 'letter' | 'a4';
export type Density = 'compact' | 'normal';

export interface PdfOptions {
  pageSize: PageSize;
  fontSize: number; // body size in points, 9.5 to 11.5
  density: Density;
  title?: string;
  author?: string;
}

export const PAGE_POINTS: Record<PageSize, { w: number; h: number }> = {
  letter: { w: 612, h: 792 },
  a4: { w: 595.28, h: 841.89 },
};

// Glyph widths (1/1000 em) of Helvetica and Helvetica-Bold for the WinAnsi codes 32 to 255.
// From the Adobe core font metrics.
const W_REGULAR = [278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584, 0, 556, 0, 222, 556, 333, 1000, 556, 556, 333, 1000, 667, 333, 1000, 0, 611, 0, 0, 222, 222, 333, 333, 350, 556, 1000, 333, 1000, 500, 333, 944, 0, 500, 667, 0, 333, 556, 556, 556, 556, 260, 556, 333, 737, 370, 556, 584, 0, 737, 333, 400, 584, 0, 0, 333, 556, 537, 278, 333, 0, 365, 556, 834, 834, 834, 611, 667, 667, 667, 667, 667, 667, 1000, 722, 667, 667, 667, 667, 278, 278, 278, 278, 722, 722, 778, 778, 778, 778, 778, 584, 778, 722, 722, 722, 722, 667, 667, 611, 556, 556, 556, 556, 556, 556, 889, 500, 556, 556, 556, 556, 278, 278, 278, 278, 556, 556, 556, 556, 556, 556, 556, 584, 611, 556, 556, 556, 556, 500, 556, 500];
const W_BOLD = [278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611, 975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556, 333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611, 611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584, 0, 556, 0, 278, 556, 500, 1000, 556, 556, 333, 1000, 667, 333, 1000, 0, 611, 0, 0, 278, 278, 500, 500, 350, 556, 1000, 333, 1000, 556, 333, 944, 0, 500, 667, 0, 333, 556, 556, 556, 556, 280, 556, 333, 737, 370, 556, 584, 0, 737, 333, 400, 584, 0, 0, 333, 611, 556, 278, 333, 0, 365, 556, 834, 834, 834, 611, 722, 722, 722, 722, 722, 722, 1000, 722, 667, 667, 667, 667, 278, 278, 278, 278, 722, 722, 778, 778, 778, 778, 778, 584, 778, 722, 722, 722, 722, 667, 667, 611, 556, 556, 556, 556, 556, 556, 889, 556, 556, 556, 556, 556, 278, 278, 278, 278, 611, 611, 611, 611, 611, 611, 611, 584, 611, 611, 611, 611, 611, 556, 611, 556];

// WinAnsi (Windows-1252) bytes 0x80 to 0x9F that are not the same as Unicode
const CP1252_HIGH: Record<string, number> = {
  '€': 0x80, '‚': 0x82, 'ƒ': 0x83, '„': 0x84, '…': 0x85, '†': 0x86, '‡': 0x87, 'ˆ': 0x88,
  '‰': 0x89, 'Š': 0x8a, '‹': 0x8b, 'Œ': 0x8c, 'Ž': 0x8e, '‘': 0x91, '’': 0x92, '“': 0x93,
  '”': 0x94, '•': 0x95, '–': 0x96, '—': 0x97, '˜': 0x98, '™': 0x99, 'š': 0x9a, '›': 0x9b,
  'œ': 0x9c, 'ž': 0x9e, 'Ÿ': 0x9f,
};

// Replacements for common characters that the standard fonts cannot show
const SIMPLE: Record<string, string> = {
  '\u00a0': ' ', '\u2002': ' ', '\u2003': ' ', '\u2009': ' ', '\u202f': ' ', '\u3000': ' ',
  '\u2010': '-', '\u2011': '-', '\u2012': '-', '\u2212': '-', '\u2192': '->',
  '\u25cf': '\u2022', '\u25aa': '\u2022', '\u2023': '\u2022',
  '\u00ad': '', '\u200b': '', '\ufeff': '',
  '\u2264': '<=', '\u2265': '>=', '\u2713': '', '\u2714': '',
};

// The code of a character in the font, or null when the font cannot show it
function codeOf(ch: string): number | null {
  if (CP1252_HIGH[ch] !== undefined) return CP1252_HIGH[ch];
  const c = ch.charCodeAt(0);
  if (c >= 32 && c <= 126) return c;
  if (c >= 0xa1 && c <= 0xff) return c;
  return null;
}

// Text the standard fonts can show: odd spaces and dashes are replaced, unknown characters dropped
export function toPdfText(input: string): string {
  let out = '';
  for (const raw of Array.from(input ?? '')) {
    const ch = SIMPLE[raw] !== undefined ? SIMPLE[raw] : raw;
    for (const c of Array.from(ch)) {
      if (c === '\n' || c === '\r' || c === '\t') out += ' ';
      else if (codeOf(c) !== null) out += c;
      else if (c.normalize('NFD').charCodeAt(0) < 128 && codeOf(c.normalize('NFD')[0]) !== null) {
        out += c.normalize('NFD')[0]; // an accented letter the font lacks: keep the base letter
      }
    }
  }
  return out.replace(/ {2,}/g, ' ');
}

export function textWidth(text: string, size: number, bold = false): number {
  const table = bold ? W_BOLD : W_REGULAR;
  let units = 0;
  for (const ch of Array.from(text)) {
    const code = codeOf(ch);
    units += code === null ? 556 : table[code - 32] || 278;
  }
  return (units * size) / 1000;
}

// ---------- layout ----------

interface Styles {
  nameSize: number;
  headingSize: number;
  body: number;
  lineGap: number; // extra space between lines, as a fraction of the font size
  headingBefore: number;
  headingAfter: number;
  entryBefore: number;
  bulletGap: number;
  margin: number;
}

export function stylesFor(opts: Pick<PdfOptions, 'fontSize' | 'density' | 'pageSize'>): Styles {
  const compact = opts.density === 'compact';
  const body = Math.min(11.5, Math.max(9, opts.fontSize));
  return {
    nameSize: Math.round((body + 10) * 10) / 10,
    headingSize: Math.round((body + 0.5) * 10) / 10,
    body,
    lineGap: compact ? 0.2 : 0.28,
    headingBefore: compact ? 9 : 13,
    headingAfter: compact ? 3 : 5,
    entryBefore: compact ? 4 : 6,
    bulletGap: compact ? 0.8 : 1.8,
    margin: compact ? 42 : 50,
  };
}

interface Piece {
  text: string;
  bold: boolean;
  size: number;
  x: number;
  url?: string;
}
interface Line {
  y: number; // baseline from the top of the page
  pieces: Piece[];
  rule?: { x1: number; x2: number; y: number };
}

// Splits runs into words and fills lines up to `width`
function wrapRuns(runs: Run[], size: number, width: number, firstIndent = 0, indent = 0) {
  const lines: { text: string; bold: boolean; url?: string; w: number }[][] = [];
  let line: { text: string; bold: boolean; url?: string; w: number }[] = [];
  let used = firstIndent;
  let avail = width;
  for (const run of runs) {
    const text = toPdfText(run.text);
    const parts = text.split(/(\s+)/).filter((p) => p !== '');
    for (const part of parts) {
      const isSpace = /^\s+$/.test(part);
      const w = textWidth(part, size, !!run.bold);
      if (isSpace && line.length === 0) continue; // no space at the start of a line
      if (!isSpace && used + w > avail && line.length > 0) {
        // drop a trailing space, then start a new line
        const last = line[line.length - 1];
        if (/^\s+$/.test(last.text)) line.pop();
        lines.push(line);
        line = [];
        used = indent;
        avail = width;
      }
      // a single word longer than the line is cut where it no longer fits
      if (!isSpace && w > width - indent) {
        let chunk = '';
        for (const ch of Array.from(part)) {
          if (used + textWidth(chunk + ch, size, !!run.bold) > avail && chunk) {
            line.push({ text: chunk, bold: !!run.bold, url: run.url, w: textWidth(chunk, size, !!run.bold) });
            lines.push(line);
            line = [];
            used = indent;
            chunk = '';
          }
          chunk += ch;
        }
        if (chunk) {
          line.push({ text: chunk, bold: !!run.bold, url: run.url, w: textWidth(chunk, size, !!run.bold) });
          used += textWidth(chunk, size, !!run.bold);
        }
        continue;
      }
      line.push({ text: part, bold: !!run.bold, url: run.url, w });
      used += w;
    }
  }
  if (line.length) {
    const last = line[line.length - 1];
    if (/^\s+$/.test(last.text)) line.pop();
    if (line.length) lines.push(line);
  }
  return lines;
}

export interface LaidOut {
  pages: Line[][];
  pageWidth: number;
  pageHeight: number;
}

export function layoutBlocks(blocks: DocBlock[], opts: PdfOptions): LaidOut {
  const s = stylesFor(opts);
  const { w: pw, h: ph } = PAGE_POINTS[opts.pageSize];
  const left = s.margin;
  const right = pw - s.margin;
  const width = right - left;
  const top = s.margin;
  const bottom = ph - s.margin;

  const pages: Line[][] = [[]];
  let y = top; // top of the next line
  const page = () => pages[pages.length - 1];
  const newPage = () => {
    pages.push([]);
    y = top;
  };
  const lh = (size: number) => size * (1 + s.lineGap);
  // moves to a new page when `need` points do not fit
  const ensure = (need: number) => {
    if (y + need > bottom && page().length > 0) newPage();
  };
  const put = (pieces: Piece[], size: number, rule?: Line['rule']) => {
    const h = lh(size);
    page().push({ y: y + size * 1.0 + (h - size) / 2 - size * 0.05, pieces, rule });
    y += h;
  };

  blocks.forEach((b, index) => {
    const next = blocks[index + 1];
    if (b.kind === 'name') {
      const size = s.nameSize;
      const text = toPdfText(b.text);
      const w = textWidth(text, size, true);
      ensure(lh(size));
      put([{ text, bold: true, size, x: left + Math.max(0, (width - w) / 2) }], size);
      y += 2;
    } else if (b.kind === 'contact') {
      const size = s.body - 0.5;
      const wrapped = wrapRuns(b.runs, size, width);
      for (const ln of wrapped) {
        const total = ln.reduce((a, p) => a + p.w, 0);
        let x = left + Math.max(0, (width - total) / 2);
        const pieces: Piece[] = ln.map((p) => {
          const piece = { text: p.text, bold: p.bold, size, x, url: p.url };
          x += p.w;
          return piece;
        });
        ensure(lh(size));
        put(pieces, size);
      }
    } else if (b.kind === 'heading') {
      const size = s.headingSize;
      // keep a heading together with the lines that follow it
      ensure(s.headingBefore + lh(size) + s.headingAfter + lh(s.body) * 2);
      if (page().length > 0) y += s.headingBefore;
      const text = toPdfText(b.text).toUpperCase();
      const ruleY = y + lh(size) + 0.5;
      put([{ text, bold: true, size, x: left }], size, { x1: left, x2: right, y: ruleY });
      y += s.headingAfter;
    } else if (b.kind === 'entry') {
      const size = s.body;
      const hasSub = !!(b.sub || b.subRight);
      ensure(s.entryBefore + lh(size) * (hasSub ? 2 : 1) + lh(size));
      y += s.entryBefore;
      const l = toPdfText(b.left);
      const r = toPdfText(b.right ?? '');
      const rw = r ? textWidth(r, size, false) : 0;
      // a long title wraps; the date stays on the first line
      const titleLines = wrapRuns([{ text: l, bold: true }], size, width - rw - 10);
      titleLines.forEach((ln, i) => {
        let x = left;
        const pieces: Piece[] = ln.map((p) => {
          const piece = { text: p.text, bold: true, size, x };
          x += p.w;
          return piece;
        });
        if (i === 0 && r) pieces.push({ text: r, bold: false, size, x: right - rw });
        ensure(lh(size));
        put(pieces, size);
      });
      if (hasSub) {
        const sub = toPdfText(b.sub ?? '');
        const subRight = toPdfText(b.subRight ?? '');
        const srw = subRight ? textWidth(subRight, size, false) : 0;
        const subLines = wrapRuns([{ text: sub }], size, width - srw - 10);
        subLines.forEach((ln, i) => {
          let x = left;
          const pieces: Piece[] = ln.map((p) => {
            const piece = { text: p.text, bold: false, size, x };
            x += p.w;
            return piece;
          });
          if (i === 0 && subRight) pieces.push({ text: subRight, bold: false, size, x: right - srw });
          ensure(lh(size));
          put(pieces, size);
        });
      }
    } else {
      const size = s.body;
      const isBullet = b.kind === 'bullet';
      const indent = isBullet ? 14 : 0;
      const wrapped = wrapRuns(b.runs, size, width - indent, 0, 0);
      wrapped.forEach((ln, i) => {
        ensure(lh(size));
        let x = left + indent;
        const pieces: Piece[] = [];
        if (isBullet && i === 0) pieces.push({ text: '•', bold: false, size, x: left + 3 });
        for (const p of ln) {
          pieces.push({ text: p.text, bold: p.bold, size, x, url: p.url });
          x += p.w;
        }
        put(pieces, size);
      });
      if (isBullet && next?.kind !== 'bullet') y += 0;
      else if (isBullet) y += s.bulletGap;
    }
  });

  if (pages.length > 1 && pages[pages.length - 1].length === 0) pages.pop();
  return { pages, pageWidth: pw, pageHeight: ph };
}

// ---------- PDF output ----------

function esc(text: string): string {
  let out = '';
  for (const ch of text) {
    const code = codeOf(ch);
    if (code === null) continue;
    if (ch === '(' || ch === ')' || ch === '\\') out += '\\' + ch;
    else if (code < 128) out += ch;
    else out += '\\' + code.toString(8).padStart(3, '0');
  }
  return out;
}

const num = (n: number) => (Math.round(n * 100) / 100).toString();

function pdfString(text: string): string {
  // metadata strings use PDFDocEncoding; plain ASCII is enough here
  return '(' + text.replace(/[^\x20-\x7e]/g, '').replace(/([()\\])/g, '\\$1') + ')';
}

export function buildPdf(blocks: DocBlock[], opts: PdfOptions): Uint8Array {
  const laid = layoutBlocks(blocks, opts);
  const { pageWidth: pw, pageHeight: ph } = laid;
  const objects: string[] = []; // index 0 is object 1
  const add = (body: string) => {
    objects.push(body);
    return objects.length; // the object number
  };

  const fontRegular = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  const fontBold = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');

  // placeholders for the page tree and the catalog (numbers are fixed after the pages exist)
  const pagesRef = add('');
  const pageRefs: number[] = [];

  for (const lines of laid.pages) {
    let ops = '';
    const annots: number[] = [];
    for (const line of lines) {
      const baseline = ph - line.y;
      for (const piece of line.pieces) {
        ops += `BT /${piece.bold ? 'F2' : 'F1'} ${num(piece.size)} Tf ${num(piece.x)} ${num(baseline)} Td (${esc(piece.text)}) Tj ET\n`;
        if (piece.url) {
          const w = textWidth(piece.text, piece.size, piece.bold);
          const uri = piece.url.replace(/[^\x21-\x7e]/g, '').replace(/([()\\])/g, '\\$1');
          annots.push(
            add(
              `<< /Type /Annot /Subtype /Link /Border [0 0 0] /Rect [${num(piece.x)} ${num(baseline - piece.size * 0.25)} ${num(piece.x + w)} ${num(baseline + piece.size * 0.85)}] /A << /S /URI /URI (${uri}) >> >>`
            )
          );
        }
      }
      if (line.rule) {
        ops += `0.4 w 0.35 G ${num(line.rule.x1)} ${num(ph - line.rule.y)} m ${num(line.rule.x2)} ${num(ph - line.rule.y)} l S 0 G\n`;
      }
    }
    const content = add(`<< /Length ${ops.length} >>\nstream\n${ops}endstream`);
    const pageObj = add(
      `<< /Type /Page /Parent ${pagesRef} 0 R /MediaBox [0 0 ${num(pw)} ${num(ph)}] /Resources << /Font << /F1 ${fontRegular} 0 R /F2 ${fontBold} 0 R >> >> /Contents ${content} 0 R${
        annots.length ? ` /Annots [${annots.map((a) => `${a} 0 R`).join(' ')}]` : ''
      } >>`
    );
    pageRefs.push(pageObj);
  }

  objects[pagesRef - 1] = `<< /Type /Pages /Kids [${pageRefs.map((p) => `${p} 0 R`).join(' ')}] /Count ${pageRefs.length} >>`;
  const catalog = add(`<< /Type /Catalog /Pages ${pagesRef} 0 R /Lang (en-US) >>`);
  const info = add(
    `<< /Title ${pdfString(opts.title || 'Resume')} /Author ${pdfString(opts.author || '')} /Producer (Portfolio resume builder) >>`
  );

  let out = '%PDF-1.4\n%âãÏÓ\n';
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) out += `${String(off).padStart(10, '0')} 00000 n \n`;
  out += `trailer\n<< /Size ${objects.length + 1} /Root ${catalog} 0 R /Info ${info} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;

  // every character is below 256, so the string maps one to one onto bytes
  const bytes = new Uint8Array(out.length);
  for (let i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 0xff;
  return bytes;
}

export function pageCount(blocks: DocBlock[], opts: PdfOptions): number {
  return layoutBlocks(blocks, opts).pages.length;
}
