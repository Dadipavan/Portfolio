'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, Download } from 'lucide-react';
import { buildPortfolioJson, downloadText } from '@/lib/exportData';
import Modal from '../Modal';
import { usePortfolio } from '../PortfolioProvider';

// Light syntax colouring for JSON: keys, strings, numbers and literals
function Highlighted({ json }: { json: string }) {
  const parts = json.split(
    /("(?:\\.|[^"\\])*"(?:\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g
  );
  return (
    <>
      {parts.map((part, index) => {
        if (!part) return null;
        if (/^"[\s\S]*"\s*:$/.test(part))
          return (
            <span key={index} className="json-key">
              {part}
            </span>
          );
        if (part.startsWith('"'))
          return (
            <span key={index} className="json-string">
              {part}
            </span>
          );
        if (/^(true|false|null)$/.test(part) || /^-?\d/.test(part))
          return (
            <span key={index} className="json-num">
              {part}
            </span>
          );
        return part;
      })}
    </>
  );
}

// "View as JSON": the portfolio's own data, exactly as the site uses it
export default function JsonViewDialog() {
  const { content, siteUrl, dialogs, closeDialog, track } = usePortfolio();
  const open = dialogs.json;
  const [copied, setCopied] = useState(false);

  const text = useMemo(
    () => JSON.stringify(buildPortfolioJson(content, siteUrl), null, 2),
    [content, siteUrl]
  );

  useEffect(() => {
    if (open) track('json_view');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard can be blocked */
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => closeDialog('json')}
      size="xl"
      title="portfolio.json"
      description="Everything on this site, as open data."
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button type="button" onClick={copy} className="btn-secondary min-h-10">
          {copied ? (
            <Check aria-hidden="true" className="h-4 w-4 text-green-600" />
          ) : (
            <Copy aria-hidden="true" className="h-4 w-4" />
          )}
          {copied ? 'Copied' : 'Copy'}
        </button>
        <button
          type="button"
          onClick={() => {
            downloadText('portfolio.json', 'application/json', text);
            track('data_download', 'portfolio.json');
          }}
          className="btn-secondary min-h-10"
        >
          <Download aria-hidden="true" className="h-4 w-4" />
          Download
        </button>
        <span role="status" aria-live="polite" className="sr-only">
          {copied ? 'Copied to clipboard' : ''}
        </span>
      </div>
      <pre
        tabIndex={0}
        aria-label="Portfolio data as JSON"
        className="border-line bg-surface text-body max-h-[60vh] overflow-auto rounded-xl border p-4 font-mono text-xs leading-relaxed"
      >
        <code>
          <Highlighted json={text} />
        </code>
      </pre>
    </Modal>
  );
}
