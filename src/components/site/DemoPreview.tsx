'use client';

import { useState } from 'react';
import { ExternalLink, Play, X } from 'lucide-react';
import { usePortfolio } from './PortfolioProvider';

// Streamlit apps hide their toolbar when asked to embed
export function toEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
    if (parsed.hostname.endsWith('streamlit.app')) parsed.searchParams.set('embed', 'true');
    return parsed.toString();
  } catch {
    return null;
  }
}

// "Try it live": the running app inside a browser-style frame. It only loads when asked.
export default function DemoPreview({ url, title }: { url: string; title: string }) {
  const [open, setOpen] = useState(false);
  const { track } = usePortfolio();
  const src = toEmbedUrl(url);
  if (!src) return null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          track('demo_open', title);
        }}
        className="btn-primary min-h-10"
      >
        <Play aria-hidden="true" className="h-4 w-4" />
        Try it live
      </button>
    );
  }

  return (
    <div className="border-line bg-card w-full basis-full overflow-hidden rounded-xl border">
      <div className="border-line bg-surface flex items-center gap-2 border-b px-3 py-2">
        <span aria-hidden="true" className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
        </span>
        <span className="text-muted min-w-0 flex-1 truncate font-mono text-xs">
          {new URL(src).host}
        </span>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-ghost !min-h-8 !px-2 text-xs"
        >
          <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
          Open in new tab
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="btn-ghost !min-h-8 !px-2"
          aria-label="Close live preview"
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
      <iframe
        title={`${title}, live demo`}
        src={src}
        loading="lazy"
        referrerPolicy="no-referrer"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
        className="h-[30rem] w-full bg-white"
      />
      <p className="border-line text-muted border-t px-3 py-2 text-xs">
        If the preview stays blank, the app does not allow being shown inside another page. Use
        &quot;Open in new tab&quot;.
      </p>
    </div>
  );
}
