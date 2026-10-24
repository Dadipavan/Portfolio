'use client';

import { useCallback, useEffect, useState } from 'react';
import { CircleAlert, CircleCheck, Info, RefreshCw, ShieldCheck, XCircle } from 'lucide-react';

interface Check {
  id: string;
  label: string;
  status: 'ok' | 'warn' | 'error' | 'info';
  message: string;
}

const ICONS = {
  ok: { Icon: CircleCheck, className: 'text-green-600', label: 'OK' },
  warn: { Icon: CircleAlert, className: 'text-amber-600', label: 'Needs attention' },
  error: { Icon: XCircle, className: 'text-red-600', label: 'Problem' },
  info: { Icon: Info, className: 'text-blue-600', label: 'Note' },
} as const;

// Admin dashboard card that verifies the Supabase setup and shows what still needs doing.
export default function SystemCheck() {
  const [checks, setChecks] = useState<Check[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/health', { cache: 'no-store' });
      const result = await response.json().catch(() => ({}));
      if (response.ok && result.success) setChecks(result.checks);
      else setError(result.error || 'The system check could not run.');
    } catch {
      setError('Could not reach the server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    run();
  }, [run]);

  const needsAttention =
    checks?.filter((c) => c.status === 'warn' || c.status === 'error').length ?? 0;

  return (
    <section
      aria-labelledby="system-check-heading"
      className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
            <ShieldCheck className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h2 id="system-check-heading" className="text-lg font-semibold text-gray-900">
              System check
            </h2>
            <p className="text-sm text-gray-500" aria-live="polite">
              {loading
                ? 'Checking your Supabase setup...'
                : error
                  ? 'The check could not run'
                  : needsAttention === 0
                    ? 'Everything is set up correctly'
                    : `${needsAttention} item${needsAttention === 1 ? '' : 's'} need attention`}
            </p>
          </div>
        </div>
        <button
          onClick={run}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Run again
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {error}
        </p>
      )}

      {checks && (
        <ul className="mt-5 divide-y divide-gray-100">
          {checks.map((check) => {
            const { Icon, className, label } = ICONS[check.status];
            return (
              <li key={check.id} className="flex items-start gap-3 py-3">
                <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${className}`} aria-label={label} />
                <div>
                  <p className="text-sm font-medium text-gray-900">{check.label}</p>
                  <p className="text-sm text-gray-600">{check.message}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
