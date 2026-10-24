'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Contact, Copy, Download, FileText, Share2 } from 'lucide-react';
import { createQr, qrToSvg } from '@/lib/qr';
import { buildVCard } from '@/lib/vcard';
import { downloadText } from '@/lib/exportData';
import Modal from '../Modal';
import { usePortfolio } from '../PortfolioProvider';

// QR code, copy link, save contact, print-ready CV
export default function ShareDialog() {
  const { content, siteUrl, dialogs, closeDialog, role, track, t } = usePortfolio();
  const open = dialogs.share;
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setCanShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function');
  }, []);
  useEffect(() => {
    if (open) track('share_open');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const link = useMemo(() => {
    const base = siteUrl || (typeof window !== 'undefined' ? window.location.origin : '');
    return role === 'all' ? base : `${base}?role=${role}`;
  }, [siteUrl, role]);

  // Always dark on white, whatever the theme, so phones can read it
  const svg = useMemo(() => {
    try {
      return qrToSvg(createQr(link), { dark: '#0f172a', light: '#ffffff' });
    } catch {
      return '';
    }
  }, [link]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard can be blocked */
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => closeDialog('share')}
      title={t('share.title')}
      description={t('share.help')}
    >
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-start">
        <div className="mx-auto w-48 shrink-0">
          {svg ? (
            <div
              role="img"
              aria-label={`QR code for ${link}`}
              className="border-line overflow-hidden rounded-xl border bg-white p-1"
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          ) : (
            <p className="text-muted text-sm">The address is too long for a QR code.</p>
          )}
        </div>

        <div className="space-y-3">
          <label htmlFor="share-link" className="mono-label block">
            Link{role !== 'all' ? ' (opens in the chosen role view)' : ''}
          </label>
          <input
            id="share-link"
            readOnly
            value={link}
            onFocus={(e) => e.currentTarget.select()}
            className="field font-mono text-xs"
          />

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={copy} className="btn-secondary min-h-10">
              {copied ? (
                <Check aria-hidden="true" className="h-4 w-4 text-green-600" />
              ) : (
                <Copy aria-hidden="true" className="h-4 w-4" />
              )}
              {copied ? 'Copied' : 'Copy link'}
            </button>
            {canShare && (
              <button
                type="button"
                className="btn-secondary min-h-10"
                onClick={() =>
                  navigator.share({ title: content.personalInfo.name, url: link }).catch(() => {})
                }
              >
                <Share2 aria-hidden="true" className="h-4 w-4" />
                Share
              </button>
            )}
            {svg && (
              <button
                type="button"
                className="btn-secondary min-h-10"
                onClick={() => downloadText('portfolio-qr.svg', 'image/svg+xml', svg)}
              >
                <Download aria-hidden="true" className="h-4 w-4" />
                QR code (SVG)
              </button>
            )}
          </div>

          <div className="border-line flex flex-wrap gap-2 border-t pt-3">
            <button
              type="button"
              className="btn-secondary min-h-10"
              onClick={() =>
                downloadText(
                  `${content.personalInfo.shortName.replace(/\s+/g, '-').toLowerCase()}.vcf`,
                  'text/vcard',
                  buildVCard(content.personalInfo, siteUrl)
                )
              }
            >
              <Contact aria-hidden="true" className="h-4 w-4" />
              {t('share.saveContact')}
            </button>
            <a
              href={role === 'all' ? '/resume' : `/resume?role=${role}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary min-h-10"
            >
              <FileText aria-hidden="true" className="h-4 w-4" />
              {t('share.cv')}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </div>
          <span role="status" aria-live="polite" className="sr-only">
            {copied ? 'Link copied to clipboard' : ''}
          </span>
        </div>
      </div>
    </Modal>
  );
}
