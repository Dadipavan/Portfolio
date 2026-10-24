'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { usePortfolio } from './PortfolioProvider';

export default function CopyEmailButton({ email }: { email: string }) {
  const { t } = usePortfolio();
  const [copied, setCopied] = useState(false);
  const timer = useRef<number>(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be blocked; the address is still visible and selectable
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="border-line bg-card text-ink hover:border-line-strong hover:bg-surface inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium whitespace-nowrap transition-colors"
    >
      {copied ? (
        <Check aria-hidden="true" className="h-4 w-4 text-green-700 dark:text-green-400" />
      ) : (
        <Copy aria-hidden="true" className="h-4 w-4" />
      )}
      {copied ? 'Copied' : t('contact.copy')}
      <span className="sr-only"> email address</span>
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? 'Email address copied to clipboard' : ''}
      </span>
    </button>
  );
}
