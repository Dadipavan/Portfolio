'use client';

import { useId, useRef, useState } from 'react';
import {
  Bold,
  Code,
  FileCode,
  Heading2,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
} from 'lucide-react';
import Markdown from '@/components/site/Markdown';
import { hasText } from '@/lib/markdown';
import type { MediaFile } from '@/lib/types';
import { hintClass, inputClass } from './kit';

interface MarkdownEditorProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  // pictures of this item that can be placed inside the text
  media?: MediaFile[];
  rows?: number;
  placeholder?: string;
  hint?: string;
  // the site keeps at most this many characters of a long text, so typing stops here rather than losing the end later
  maxLength?: number;
}

interface Edit {
  value: string;
  from: number;
  to: number;
}

// A text box with a formatting bar and a preview, for writing like in a blog: no code needed.
export default function MarkdownEditor({
  id,
  label,
  value,
  onChange,
  media = [],
  rows = 8,
  placeholder,
  hint,
  maxLength = 20000,
}: MarkdownEditorProps) {
  const area = useRef<HTMLTextAreaElement>(null);
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const [picking, setPicking] = useState(false);
  const helpId = useId();

  const apply = (build: (selected: string, start: number, end: number) => Edit) => {
    const element = area.current;
    if (!element) return;
    const start = element.selectionStart;
    const end = element.selectionEnd;
    const edit = build(value.slice(start, end), start, end);
    onChange(edit.value);
    requestAnimationFrame(() => {
      element.focus();
      element.setSelectionRange(edit.from, edit.to);
    });
  };

  const wrap = (before: string, after = before, fallback = 'text') =>
    apply((selected, start, end) => {
      const inner = selected || fallback;
      const next = value.slice(0, start) + before + inner + after + value.slice(end);
      return { value: next, from: start + before.length, to: start + before.length + inner.length };
    });

  // puts a prefix at the start of every selected line ("## ", "- ", "> ")
  const prefixLines = (prefix: (index: number) => string, fallback: string) =>
    apply((selected, start, end) => {
      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      const chosen = value.slice(lineStart, end) || fallback;
      const lines = chosen.split('\n').map((line, index) => prefix(index) + line);
      const text = lines.join('\n');
      return {
        value: value.slice(0, lineStart) + text + value.slice(end),
        from: lineStart,
        to: lineStart + text.length,
      };
    });

  const link = () =>
    apply((selected, start, end) => {
      const text = selected || 'link text';
      const insert = `[${text}](https://)`;
      const urlStart = start + text.length + 3;
      return {
        value: value.slice(0, start) + insert + value.slice(end),
        from: urlStart,
        to: urlStart + 8,
      };
    });

  const codeBlock = () =>
    apply((selected, start, end) => {
      const code = selected || 'code here';
      const insert = `\n\`\`\`\n${code}\n\`\`\`\n`;
      return {
        value: value.slice(0, start) + insert + value.slice(end),
        from: start + 5,
        to: start + 5 + code.length,
      };
    });

  const insertImage = (file: MediaFile) => {
    setPicking(false);
    apply((_selected, start, end) => {
      const insert = `\n\n![${file.caption ?? ''}](media:${file.id})\n\n`;
      return {
        value: value.slice(0, start) + insert + value.slice(end),
        from: start + insert.length,
        to: start + insert.length,
      };
    });
  };

  const tools: { label: string; icon: typeof Bold; run: () => void }[] = [
    { label: 'Bold', icon: Bold, run: () => wrap('**') },
    { label: 'Italic', icon: Italic, run: () => wrap('*') },
    { label: 'Heading', icon: Heading2, run: () => prefixLines(() => '## ', 'Heading') },
    { label: 'Bulleted list', icon: List, run: () => prefixLines(() => '- ', 'List item') },
    {
      label: 'Numbered list',
      icon: ListOrdered,
      run: () => prefixLines((i) => `${i + 1}. `, 'List item'),
    },
    { label: 'Quote', icon: Quote, run: () => prefixLines(() => '> ', 'Quote') },
    { label: 'Link', icon: Link2, run: link },
    { label: 'Code in a line', icon: Code, run: () => wrap('`', '`', 'code') },
    { label: 'Code block', icon: FileCode, run: codeBlock },
  ];

  const images = media.filter((file) => file.mime.startsWith('image/'));

  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
        </label>
        <div
          role="tablist"
          aria-label={`${label}: write or preview`}
          className="inline-flex rounded-lg border border-gray-300 bg-white p-0.5 text-xs font-medium"
        >
          {(['write', 'preview'] as const).map((name) => (
            <button
              key={name}
              type="button"
              role="tab"
              aria-selected={tab === name}
              onClick={() => setTab(name)}
              className={`rounded-md px-3 py-1 ${tab === name ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              {name === 'write' ? 'Write' : 'Preview'}
            </button>
          ))}
        </div>
      </div>

      {tab === 'write' ? (
        <>
          <div
            className="flex flex-wrap items-center gap-1 rounded-t-lg border border-b-0 border-gray-300 bg-gray-50 p-1"
            role="toolbar"
            aria-label="Formatting"
          >
            {tools.map(({ label: name, icon: Icon, run }) => (
              <button
                key={name}
                type="button"
                onClick={run}
                title={name}
                aria-label={name}
                className="rounded p-1.5 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
              >
                <Icon size={16} aria-hidden="true" />
              </button>
            ))}
            {images.length > 0 && (
              <span className="relative">
                <button
                  type="button"
                  onClick={() => setPicking((open) => !open)}
                  aria-expanded={picking}
                  title="Put one of this item's pictures in the text"
                  aria-label="Insert a picture"
                  className="rounded p-1.5 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
                >
                  <ImageIcon size={16} aria-hidden="true" />
                </button>
                {picking && (
                  <ul className="absolute top-full left-0 z-20 mt-1 max-h-64 w-64 overflow-auto rounded-lg border border-gray-200 bg-white p-1 shadow-lg">
                    {images.map((file) => (
                      <li key={file.id}>
                        <button
                          type="button"
                          onClick={() => insertImage(file)}
                          className="flex w-full items-center gap-2 rounded p-1.5 text-left text-xs hover:bg-gray-100"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`/api/media/${file.path}`}
                            alt=""
                            className="h-9 w-12 shrink-0 rounded object-cover"
                          />
                          <span className="min-w-0 truncate">{file.caption || file.name}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </span>
            )}
          </div>
          <textarea
            ref={area}
            id={id}
            rows={rows}
            value={value}
            placeholder={placeholder}
            maxLength={maxLength}
            onChange={(event) => onChange(event.target.value)}
            aria-describedby={helpId}
            className={`${inputClass} resize-y !rounded-t-none font-mono text-sm leading-relaxed`}
          />
        </>
      ) : (
        <div id={id} className="min-h-[8rem] rounded-lg border border-gray-300 bg-white p-4">
          {hasText(value) || value.includes('media:') ? (
            <Markdown source={value} media={media} headingOffset={1} />
          ) : (
            <p className="text-sm text-gray-500">
              Nothing to preview yet. Switch to Write and type something.
            </p>
          )}
        </div>
      )}

      <p id={helpId} className={hintClass}>
        {hint ? `${hint} ` : ''}
        Use the buttons above, or type: **bold**, *italic*, ## heading, - list, 1. numbered, &gt;
        quote, [text](https://link), `code`.
      </p>
      {value.length >= maxLength * 0.8 && (
        <p
          role={value.length >= maxLength ? 'alert' : 'status'}
          className={`mt-1 text-xs ${value.length >= maxLength ? 'font-medium text-red-700' : 'text-amber-800'}`}
        >
          {value.length >= maxLength
            ? `You have reached the limit for this box (${maxLength} characters). Move the rest into an extra section.`
            : `${value.length} of ${maxLength} characters used.`}
        </p>
      )}
    </div>
  );
}
