'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

const button =
  'pager-button border-line text-ink hover:border-line-strong inline-flex h-10 w-10 items-center justify-center rounded-full border text-sm font-medium transition-colors disabled:cursor-default disabled:opacity-40';

// Round page buttons: previous, 1 2 3 ..., next. Shows nothing when there is only one page.
export default function Pager({
  label,
  pages,
  current,
  onChange,
}: {
  label: string;
  pages: number;
  current: number;
  onChange: (page: number) => void;
}) {
  if (pages <= 1) return null;
  return (
    <nav aria-label={label} className="pager mt-10 flex flex-wrap items-center justify-center gap-2">
      <button
        type="button"
        className={button}
        onClick={() => onChange(current - 1)}
        disabled={current === 0}
        aria-label="Previous page"
      >
        <ChevronLeft size={16} aria-hidden="true" />
      </button>
      {Array.from({ length: pages }, (_, index) => (
        <button
          key={index}
          type="button"
          className={`${button} ${index === current ? 'pager-current bg-ink text-page border-transparent' : ''}`}
          onClick={() => onChange(index)}
          aria-label={`Page ${index + 1}`}
          aria-current={index === current ? 'page' : undefined}
        >
          {index + 1}
        </button>
      ))}
      <button
        type="button"
        className={button}
        onClick={() => onChange(current + 1)}
        disabled={current === pages - 1}
        aria-label="Next page"
      >
        <ChevronRight size={16} aria-hidden="true" />
      </button>
    </nav>
  );
}
