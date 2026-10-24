// A small, safe Markdown reader for the texts written in the admin (project case studies and achievements).
// It understands the few things a person writing about a project needs: headings, paragraphs, bold, italic, links,
// bulleted and numbered lists, quotes, code blocks, inline code, pictures from the project's uploads, and a divider.
// It never produces raw HTML: the result is a plain structure that React turns into elements, so nothing a person
// types (including <script> or javascript: links) can run.
import { toWebUrl } from './url';

export type Inline =
  | { type: 'text'; text: string }
  | { type: 'strong'; children: Inline[] }
  | { type: 'em'; children: Inline[] }
  | { type: 'code'; text: string }
  | { type: 'link'; href: string; children: Inline[] }
  | { type: 'image'; alt: string; src: string }
  | { type: 'br' };

export interface ListItem {
  children: Inline[];
  sublist?: Extract<Block, { type: 'list' }>;
}

export type Block =
  | { type: 'heading'; level: 1 | 2 | 3; children: Inline[] }
  | { type: 'paragraph'; children: Inline[] }
  | { type: 'list'; ordered: boolean; items: ListItem[] }
  | { type: 'quote'; children: Block[] }
  | { type: 'code'; lang: string; text: string }
  | { type: 'rule' };

const MAX_DEPTH = 4;

// "media:3f2a..." refers to a picture uploaded for the same project
const MEDIA_REFERENCE = /^media:[A-Za-z0-9_-]{1,60}$/;

// Only web addresses and e-mail links become links; anything else (javascript:, data:) stays plain text
function safeHref(value: string): string {
  const text = value.trim();
  if (/^mailto:[^\s<>"']+@[^\s<>"']+$/i.test(text)) return text;
  return toWebUrl(text);
}

function safeImageSource(value: string): string {
  const text = value.trim();
  if (MEDIA_REFERENCE.test(text)) return text;
  return /^https:\/\//i.test(text) ? toWebUrl(text) : '';
}

// Finds the closing marker of `**bold**`, `*italic*` or `_italic_` that is not inside a code span
function findClosing(source: string, from: number, marker: string): number {
  let i = from;
  while (i < source.length) {
    if (source[i] === '\\') {
      i += 2;
      continue;
    }
    if (source[i] === '`') {
      const close = source.indexOf('`', i + 1);
      if (close === -1) return -1;
      i = close + 1;
      continue;
    }
    if (source.startsWith(marker, i)) return i;
    i += 1;
  }
  return -1;
}

export function parseInline(source: string, depth = 0): Inline[] {
  const out: Inline[] = [];
  let buffer = '';
  const flush = () => {
    if (buffer) {
      out.push({ type: 'text', text: buffer });
      buffer = '';
    }
  };

  let i = 0;
  while (i < source.length) {
    const ch = source[i];

    // a backslash makes the next character ordinary text
    if (ch === '\\' && i + 1 < source.length && /[\\`*_[\]()#>!~-]/.test(source[i + 1])) {
      buffer += source[i + 1];
      i += 2;
      continue;
    }

    if (ch === '\n') {
      flush();
      out.push({ type: 'br' });
      i += 1;
      continue;
    }

    if (ch === '`') {
      const close = source.indexOf('`', i + 1);
      if (close > i + 1) {
        flush();
        out.push({ type: 'code', text: source.slice(i + 1, close) });
        i = close + 1;
        continue;
      }
    }

    if (depth < MAX_DEPTH && source.startsWith('**', i)) {
      const close = findClosing(source, i + 2, '**');
      if (close > i + 2) {
        flush();
        out.push({ type: 'strong', children: parseInline(source.slice(i + 2, close), depth + 1) });
        i = close + 2;
        continue;
      }
    }

    if (depth < MAX_DEPTH && (ch === '*' || ch === '_') && !source.startsWith(ch + ch, i)) {
      const previous = source[i - 1];
      // an underscore inside a word (snake_case_name) is not emphasis
      const insideWord = ch === '_' && previous !== undefined && /[A-Za-z0-9]/.test(previous);
      const close = insideWord ? -1 : findClosing(source, i + 1, ch);
      if (close > i + 1 && !/\s/.test(source[i + 1]) && !/\s/.test(source[close - 1])) {
        flush();
        out.push({ type: 'em', children: parseInline(source.slice(i + 1, close), depth + 1) });
        i = close + 1;
        continue;
      }
    }

    // ![alt](source) and [text](address)
    if (ch === '!' && source[i + 1] === '[') {
      const m = /^!\[([^\]]*)\]\(((?:[^()\s]|\([^()\s]*\))+)\)/.exec(source.slice(i));
      if (m) {
        const src = safeImageSource(m[2]);
        if (src) {
          flush();
          out.push({ type: 'image', alt: m[1], src });
          i += m[0].length;
          continue;
        }
      }
    }

    if (ch === '[' && depth < MAX_DEPTH) {
      const m = /^\[([^\]]+)\]\(((?:[^()\s]|\([^()\s]*\))+)\)/.exec(source.slice(i));
      if (m) {
        const href = safeHref(m[2]);
        flush();
        if (href) out.push({ type: 'link', href, children: parseInline(m[1], depth + 1) });
        else out.push(...parseInline(m[1], depth + 1));
        i += m[0].length;
        continue;
      }
    }

    // a bare web address becomes a link
    if ((ch === 'h' || ch === 'H') && /^https?:\/\//i.test(source.slice(i, i + 8))) {
      const m = /^https?:\/\/[^\s<>"')\]]+/i.exec(source.slice(i));
      if (m) {
        const trimmed = m[0].replace(/[.,;:!?]+$/, '');
        const href = safeHref(trimmed);
        if (href) {
          flush();
          out.push({ type: 'link', href, children: [{ type: 'text', text: trimmed }] });
          i += trimmed.length;
          continue;
        }
      }
    }

    buffer += ch;
    i += 1;
  }

  flush();
  return out;
}

const FENCE = /^\s{0,3}```\s*([A-Za-z0-9_+#.-]*)\s*$/;
const HEADING = /^\s{0,3}(#{1,3})\s+(.*?)\s*#*\s*$/;
const RULE = /^\s{0,3}([-*_])(\s*\1){2,}\s*$/;
const QUOTE = /^\s{0,3}>\s?(.*)$/;
const LIST = /^(\s*)([-*+]|\d{1,3}[.)])\s+(.*)$/;

function isBlockStart(line: string): boolean {
  return (
    FENCE.test(line) || HEADING.test(line) || RULE.test(line) || QUOTE.test(line) || LIST.test(line)
  );
}

interface ListLine {
  indent: number;
  ordered: boolean;
  text: string;
}

// Builds nested lists from consecutive list lines, using how far each line is indented
function buildList(lines: ListLine[], depth = 0): Extract<Block, { type: 'list' }> {
  const base = lines[0].indent;
  const list: Extract<Block, { type: 'list' }> = {
    type: 'list',
    ordered: lines[0].ordered,
    items: [],
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const item: ListItem = { children: parseInline(line.text) };
    i += 1;

    const nested: ListLine[] = [];
    while (i < lines.length && lines[i].indent > base) {
      nested.push(lines[i]);
      i += 1;
    }
    if (nested.length > 0 && depth < MAX_DEPTH) item.sublist = buildList(nested, depth + 1);
    list.items.push(item);
  }
  return list;
}

export function parseMarkdown(source: string, depth = 0): Block[] {
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  const blocks: Block[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === '') {
      i += 1;
      continue;
    }

    const fence = FENCE.exec(line);
    if (fence) {
      const code: string[] = [];
      i += 1;
      while (i < lines.length && !/^\s{0,3}```\s*$/.test(lines[i])) {
        code.push(lines[i]);
        i += 1;
      }
      i += 1; // the closing fence (or the end of the text)
      blocks.push({ type: 'code', lang: fence[1], text: code.join('\n') });
      continue;
    }

    const heading = HEADING.exec(line);
    if (heading) {
      blocks.push({
        type: 'heading',
        level: heading[1].length as 1 | 2 | 3,
        children: parseInline(heading[2]),
      });
      i += 1;
      continue;
    }

    if (RULE.test(line)) {
      blocks.push({ type: 'rule' });
      i += 1;
      continue;
    }

    if (QUOTE.test(line)) {
      const quoted: string[] = [];
      while (i < lines.length && QUOTE.test(lines[i])) {
        quoted.push((QUOTE.exec(lines[i]) as RegExpExecArray)[1]);
        i += 1;
      }
      blocks.push({
        type: 'quote',
        children: depth < MAX_DEPTH ? parseMarkdown(quoted.join('\n'), depth + 1) : [],
      });
      continue;
    }

    if (LIST.test(line)) {
      const items: ListLine[] = [];
      while (i < lines.length && LIST.test(lines[i])) {
        const m = LIST.exec(lines[i]) as RegExpExecArray;
        items.push({
          indent: m[1].replace(/\t/g, '    ').length,
          ordered: /\d/.test(m[2]),
          text: m[3],
        });
        i += 1;
      }
      blocks.push(buildList(items));
      continue;
    }

    const paragraph: string[] = [];
    while (i < lines.length && lines[i].trim() !== '' && !isBlockStart(lines[i])) {
      paragraph.push(lines[i].trim());
      i += 1;
    }
    if (paragraph.length === 0) {
      // a line that looked like the start of a block but is not one: keep it as text so the loop always moves on
      paragraph.push(line.trim());
      i += 1;
    }
    blocks.push({ type: 'paragraph', children: parseInline(paragraph.join('\n')) });
  }

  return blocks;
}

function inlineText(nodes: Inline[]): string {
  return nodes
    .map((node) => {
      switch (node.type) {
        case 'text':
        case 'code':
          return node.text;
        case 'br':
          return ' ';
        case 'image':
          return '';
        default:
          return inlineText(node.children);
      }
    })
    .join('');
}

function blockText(blocks: Block[]): string[] {
  return blocks.flatMap((block): string[] => {
    switch (block.type) {
      case 'heading':
      case 'paragraph':
        return [inlineText(block.children)];
      case 'list':
        return block.items.flatMap((item) => [
          inlineText(item.children),
          ...(item.sublist ? blockText([item.sublist]) : []),
        ]);
      case 'quote':
        return blockText(block.children);
      case 'code':
        return [block.text];
      default:
        return [];
    }
  });
}

// The words of a text without any of the markup (for summaries, search and "is there anything written?" checks)
export function markdownToText(source: string): string {
  return blockText(parseMarkdown(source)).join(' ').replace(/\s+/g, ' ').trim();
}

export const hasText = (source: string | undefined): boolean =>
  Boolean(source && markdownToText(source));
