'use client';

import { useEffect, useRef, useState } from 'react';
import { Braces, ChevronDown, Download } from 'lucide-react';
import { DOWNLOADS, downloadText } from '@/lib/exportData';
import { usePortfolio } from './PortfolioProvider';

// "Download my data": the portfolio as JSON or CSV, plus the raw JSON viewer
export default function DataMenu({ className = '' }: { className?: string }) {
  const { content, siteUrl, settings, openDialog, track, t } = usePortfolio();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!settings.features.dataDownloads) return null;

  return (
    <div ref={root} className={`relative inline-block ${className}`}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        className="btn-secondary min-h-10"
      >
        <Download aria-hidden="true" className="h-4 w-4" />
        {t('footer.data')}
        <ChevronDown aria-hidden="true" className="h-4 w-4" />
      </button>
      {open && (
        <ul
          role="menu"
          className="border-line bg-card shadow-lift absolute left-0 z-30 mt-2 w-60 rounded-xl border p-1.5"
        >
          {DOWNLOADS.map((option) => (
            <li key={option.id} role="none">
              <button
                type="button"
                role="menuitem"
                className="text-body hover:bg-surface hover:text-ink block w-full rounded-lg px-3 py-2 text-left text-sm"
                onClick={() => {
                  downloadText(option.filename, option.mime, option.build(content, siteUrl));
                  track('data_download', option.id);
                  setOpen(false);
                }}
              >
                {option.label}
              </button>
            </li>
          ))}
          <li role="none" className="border-line mt-1 border-t pt-1">
            <button
              type="button"
              role="menuitem"
              className="text-body hover:bg-surface hover:text-ink flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm"
              onClick={() => {
                setOpen(false);
                openDialog('json');
              }}
            >
              <Braces aria-hidden="true" className="h-4 w-4" />
              {t('footer.json')}
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
