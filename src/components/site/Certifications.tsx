'use client';

import { useEffect, useState } from 'react';
import { Award, BadgeCheck, Download, ExternalLink as OpenIcon, FileText } from 'lucide-react';
import { REVEAL_EVENT } from '@/lib/dom';
import { isPdf, isPdfUrl, mediaDownloadUrl, mediaUrl } from '@/lib/media';
import type { Certification } from '@/lib/types';
import ExternalLink from './ExternalLink';
import Markdown from './Markdown';
import Modal from './Modal';
import Pager from './Pager';
import { usePortfolio } from './PortfolioProvider';
import Section from './Section';
import Tag from './Tag';

// What can be shown for a certificate: an uploaded picture or PDF, or a picture hosted elsewhere
function previewOf(
  item: Certification
): { kind: 'image' | 'pdf'; src: string; download?: string } | null {
  if (item.file) {
    return isPdf(item.file)
      ? { kind: 'pdf', src: mediaUrl(item.file.path), download: mediaDownloadUrl(item.file.path) }
      : {
          kind: 'image',
          src: mediaUrl(item.file.path),
          download: mediaDownloadUrl(item.file.path),
        };
  }
  if (item.imageUrl) {
    // an older certificate keeps its file as a web address, which can be a PDF as well
    return isPdfUrl(item.imageUrl)
      ? { kind: 'pdf', src: item.imageUrl, download: item.imageUrl }
      : { kind: 'image', src: item.imageUrl };
  }
  return null;
}

// certificates shown at a time (one row of the grid)
export const CERTS_PER_PAGE = 3;

const dateOf = (item: Certification) => item.issueDate || item.year || '';

function CertificateWindow({ item, onClose }: { item: Certification | null; onClose: () => void }) {
  const { t } = usePortfolio();
  const preview = item ? previewOf(item) : null;
  const date = item ? dateOf(item) : '';

  return (
    <Modal
      open={Boolean(item)}
      onClose={onClose}
      size="xl"
      fullOnMobile
      title={item?.title ?? ''}
      description={item?.issuer || undefined}
    >
      {item && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <div className="min-w-0">
            {preview?.kind === 'image' && (
              <div className="border-line bg-surface overflow-hidden rounded-xl border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview.src}
                  alt={item.file?.alt || `Certificate: ${item.title}`}
                  width={item.file?.width}
                  height={item.file?.height}
                  className="mx-auto max-h-[70vh] w-full object-contain"
                />
              </div>
            )}
            {preview?.kind === 'pdf' && (
              <div className="space-y-3">
                <div className="border-line bg-surface overflow-hidden rounded-xl border">
                  <iframe
                    title={`Certificate: ${item.title}`}
                    src={preview.src}
                    className="h-[60vh] w-full bg-white sm:h-[70vh]"
                  />
                </div>
                <p className="text-muted text-sm">
                  Cannot see the document here? Use “{t('certs.openFile')}”.
                </p>
              </div>
            )}
            {!preview && (
              <div className="border-line bg-surface text-muted rounded-xl border p-8 text-center text-sm">
                No picture or document has been added for this certificate.
              </div>
            )}
          </div>

          <div className="min-w-0 space-y-6">
            <h3 className="sr-only">{t('certs.about')}</h3>
            <dl className="space-y-3 text-sm">
              {item.issuer && (
                <div>
                  <dt className="mono-label">{t('certs.issuer')}</dt>
                  <dd className="text-ink mt-0.5 font-medium">{item.issuer}</dd>
                </div>
              )}
              {date && (
                <div>
                  <dt className="mono-label">{t('certs.issued')}</dt>
                  <dd className="text-ink mt-0.5 font-medium">{date}</dd>
                </div>
              )}
              {item.credentialId && (
                <div>
                  <dt className="mono-label">{t('certs.credential')}</dt>
                  <dd className="text-ink mt-0.5 font-mono break-all">{item.credentialId}</dd>
                </div>
              )}
            </dl>

            {item.description && <Markdown source={item.description} headingOffset={3} />}

            {item.skills && item.skills.length > 0 && (
              <div>
                <h3 className="mono-label mb-2">{t('certs.skills')}</h3>
                <ul className="flex flex-wrap gap-1.5">
                  {item.skills.map((skill) => (
                    <li key={skill}>
                      <Tag label={skill} />
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {item.verificationUrl && (
                <ExternalLink href={item.verificationUrl} showIcon={false} className="btn-primary">
                  <BadgeCheck aria-hidden="true" className="h-4 w-4" />
                  {t('certs.verify')}
                </ExternalLink>
              )}
              {preview && (
                <ExternalLink href={preview.src} showIcon={false} className="btn-secondary">
                  <OpenIcon aria-hidden="true" className="h-4 w-4" />
                  {t('certs.openFile')}
                </ExternalLink>
              )}
              {preview?.download && (
                <a href={preview.download} className="btn-secondary">
                  <Download aria-hidden="true" className="h-4 w-4" />
                  {t('certs.download')}
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default function Certifications({ number }: { number: string }) {
  const { content, t } = usePortfolio();
  const items = content.certifications;
  const additional = content.siteSettings.additionalCertifications;
  const [open, setOpen] = useState<number | null>(null);
  const pages = Math.max(1, Math.ceil(items.length / CERTS_PER_PAGE));
  const [page, setPage] = useState(0);
  const current = Math.min(page, pages - 1);
  const start = current * CERTS_PER_PAGE;

  // a link to one certificate (#certification-4, or a jump from the timeline) opens the page that holds it
  useEffect(() => {
    const reveal = (id: string) => {
      const match = id.match(/^certification-(\d+)$/);
      if (match && Number(match[1]) < items.length)
        setPage(Math.floor(Number(match[1]) / CERTS_PER_PAGE));
    };
    const onHash = () => reveal(decodeURIComponent(window.location.hash.slice(1)));
    const onReveal = (event: Event) => reveal((event as CustomEvent<string>).detail);
    onHash();
    window.addEventListener('hashchange', onHash);
    window.addEventListener(REVEAL_EVENT, onReveal);
    return () => {
      window.removeEventListener('hashchange', onHash);
      window.removeEventListener(REVEAL_EVENT, onReveal);
    };
  }, [items.length]);

  const go = (target: number) => {
    setPage(Math.min(Math.max(target, 0), pages - 1));
    document
      .getElementById('certifications')
      ?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };

  const action =
    'inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-line bg-card px-3 text-sm font-medium text-ink transition-colors hover:border-line-strong hover:bg-surface';

  return (
    <Section id="certifications" number={number}>
      {items.length > 0 && (
        <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.slice(start, start + CERTS_PER_PAGE).map((item, offset) => {
            const index = start + offset;
            const preview = previewOf(item);
            const date = dateOf(item);
            const hasMore = Boolean(preview || item.description || item.credentialId);
            return (
              <li
                key={`${item.title}-${index}`}
                id={`certification-${index}`}
                data-flash
                className="card card-hover flex flex-col overflow-hidden"
              >
                {preview && (
                  <button
                    type="button"
                    onClick={() => setOpen(index)}
                    aria-haspopup="dialog"
                    aria-label={`${t('certs.details')}: ${item.title}`}
                    className="bg-surface border-line group relative block h-40 w-full overflow-hidden border-b"
                  >
                    {preview.kind === 'image' ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={preview.src}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <span className="text-muted flex h-full flex-col items-center justify-center gap-2">
                        <FileText aria-hidden="true" className="h-9 w-9" />
                        <span className="text-xs font-semibold tracking-wide">PDF</span>
                      </span>
                    )}
                  </button>
                )}

                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-start justify-between gap-3">
                    <span className="bg-accent-soft text-accent-ink flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                      <Award aria-hidden="true" className="h-5 w-5" />
                    </span>
                    {date && (
                      <span className="text-muted pt-1 font-mono text-sm tabular-nums">{date}</span>
                    )}
                  </div>
                  <h3 className="text-ink mt-5 text-base leading-snug font-semibold tracking-tight">
                    {item.title}
                  </h3>
                  {item.issuer && (
                    <p className="text-accent-ink mt-1 text-sm font-medium">{item.issuer}</p>
                  )}
                  {item.credentialId && (
                    <p className="text-subtle mt-1 font-mono text-xs break-all">
                      {t('certs.credential')}: {item.credentialId}
                    </p>
                  )}

                  {item.skills && item.skills.length > 0 && (
                    <ul className="mt-4 flex flex-wrap gap-1.5" aria-label={t('certs.skills')}>
                      {item.skills.map((skill) => (
                        <li key={skill}>
                          <Tag label={skill} />
                        </li>
                      ))}
                    </ul>
                  )}

                  {(item.verificationUrl || hasMore) && (
                    <div className="mt-auto flex flex-wrap gap-2 pt-5">
                      {hasMore && (
                        <button
                          type="button"
                          onClick={() => setOpen(index)}
                          aria-haspopup="dialog"
                          className={action}
                        >
                          <FileText aria-hidden="true" className="text-accent-ink h-4 w-4" />
                          {t('certs.details')}
                        </button>
                      )}
                      {item.verificationUrl && (
                        <ExternalLink
                          href={item.verificationUrl}
                          showIcon={false}
                          className={action}
                        >
                          <BadgeCheck aria-hidden="true" className="text-accent-ink h-4 w-4" />
                          {t('certs.verify')}
                        </ExternalLink>
                      )}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <Pager label="Certification pages" pages={pages} current={current} onChange={go} />

      {additional.length > 0 && (
        <div className={`card p-6 sm:p-8 ${items.length > 0 ? 'mt-10' : ''}`}>
          <h3 className="text-ink text-lg font-semibold tracking-tight">{t('certs.additional')}</h3>
          <ul className="text-body mt-5 grid grid-cols-1 gap-x-10 gap-y-3 text-sm md:grid-cols-2">
            {additional.map((line) => (
              <li key={line} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="bg-accent/60 mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <CertificateWindow
        item={open === null ? null : (items[open] ?? null)}
        onClose={() => setOpen(null)}
      />
    </Section>
  );
}
