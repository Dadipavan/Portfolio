'use client';

import { useEffect, useState } from 'react';
import { Building2, Calendar, ChevronDown, MapPin } from 'lucide-react';
import { REVEAL_EVENT } from '@/lib/dom';
import { mediaUrl } from '@/lib/media';
import type { Experience as Job } from '@/lib/types';
import ExternalLink from './ExternalLink';
import Pager from './Pager';
import Section from './Section';
import Tag from './Tag';
import { usePortfolio } from './PortfolioProvider';

// roles shown at a time; the page buttons only appear when there are more roles than this
export const ROLES_PER_PAGE = 1;
// bullet points shown before "View more"
const PREVIEW_POINTS = 2;

const initialsOf = (company: string) =>
  company
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('') || '·';

function Logo({ job }: { job: Job }) {
  return (
    <span className="exp-logo border-line bg-surface text-muted flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border text-sm font-semibold sm:h-[4.5rem] sm:w-[4.5rem]">
      {job.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={mediaUrl(job.logo.path)}
          alt={job.logo.alt || `${job.company} logo`}
          loading="lazy"
          className="h-full w-full object-contain p-1.5"
        />
      ) : (
        <span aria-hidden="true">{initialsOf(job.company)}</span>
      )}
    </span>
  );
}

function RoleCard({ job, number }: { job: Job; number: number }) {
  const { t } = usePortfolio();
  const [open, setOpen] = useState(false);
  const points = job.description;
  const shown = open ? points : points.slice(0, PREVIEW_POINTS);
  const hasMore = points.length > PREVIEW_POINTS;
  const panelId = `experience-points-${job.id}`;

  return (
    <li
      id={`experience-${job.id}`}
      data-flash
      className="exp-item grid grid-cols-1 gap-3 rounded-2xl md:grid-cols-[6.5rem_minmax(0,1fr)] md:gap-x-8 lg:grid-cols-[9rem_minmax(0,1fr)]"
    >
      <span
        aria-hidden="true"
        className="exp-number text-ink hidden text-[7rem] leading-none font-bold tabular-nums opacity-[0.07] select-none md:block lg:text-[9rem]"
      >
        {number}
      </span>

      <div className="exp-card card p-5 sm:p-7">
        <div className="flex items-start gap-4 sm:gap-5">
          <Logo job={job} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
              <h3 className="text-ink text-xl font-semibold tracking-tight sm:text-2xl">
                {job.title}
              </h3>
              {job.website && (
                <ExternalLink
                  href={job.website}
                  className="text-ink hover:text-accent-ink inline-flex items-center gap-1.5 text-sm font-medium"
                >
                  {t('exp.visit')}
                </ExternalLink>
              )}
            </div>
            <ul className="text-muted mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
              {job.company && (
                <li className="flex items-center gap-1.5">
                  <Building2 size={15} aria-hidden="true" className="shrink-0" />
                  {job.company}
                </li>
              )}
              {job.period && (
                <li className="flex items-center gap-1.5">
                  <Calendar size={15} aria-hidden="true" className="shrink-0" />
                  {job.period}
                </li>
              )}
              {job.location && (
                <li className="flex items-center gap-1.5">
                  <MapPin size={15} aria-hidden="true" className="shrink-0" />
                  {job.location}
                </li>
              )}
              {job.type && <li className="chip">{job.type}</li>}
            </ul>
          </div>
        </div>

        <div className="mt-5 sm:pl-[calc(4.5rem+1.25rem)]">
          {job.summary && <p className="text-body text-[0.95rem] leading-relaxed">{job.summary}</p>}

          {points.length > 0 && (
            <div className={job.summary ? 'mt-5' : ''}>
              <h4 className="text-ink text-sm font-semibold">{t('exp.responsibilities')}</h4>
              <ul id={panelId} className="text-body mt-2.5 space-y-2 text-sm leading-relaxed">
                {shown.map((line, index) => (
                  <li key={`${index}-${line}`} className="flex gap-3">
                    <span
                      aria-hidden="true"
                      className="bg-accent/60 mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                    />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
              {hasMore && (
                <button
                  type="button"
                  onClick={() => setOpen((value) => !value)}
                  aria-expanded={open}
                  aria-controls={panelId}
                  className="exp-more bg-ink text-page mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg px-4 text-sm font-medium transition-opacity hover:opacity-85"
                >
                  {open ? t('exp.less') : t('exp.more')}
                  <ChevronDown
                    size={16}
                    aria-hidden="true"
                    className={`transition-transform ${open ? 'rotate-180' : ''}`}
                  />
                </button>
              )}
            </div>
          )}

          {job.skills && job.skills.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-2" aria-label="Skills used">
              {job.skills.map((skill) => (
                <li key={skill}>
                  <Tag label={skill} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </li>
  );
}

export default function Experience({ number }: { number: string }) {
  const { content } = usePortfolio();
  const items = content.experience;
  const pages = Math.max(1, Math.ceil(items.length / ROLES_PER_PAGE));
  const [page, setPage] = useState(0);
  const current = Math.min(page, pages - 1);
  const start = current * ROLES_PER_PAGE;

  // a link to one role (#experience-3, or a jump from the timeline) opens the page that holds it
  useEffect(() => {
    const reveal = (id: string) => {
      const match = id.match(/^experience-(.+)$/);
      if (!match) return;
      const index = items.findIndex((job) => String(job.id) === match[1]);
      if (index >= 0) setPage(Math.floor(index / ROLES_PER_PAGE));
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
  }, [items]);

  const go = (target: number) => {
    setPage(Math.min(Math.max(target, 0), pages - 1));
    document.getElementById('experience')?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };

  return (
    <Section id="experience" number={number}>
      <ol className="space-y-6 sm:space-y-8">
        {items.slice(start, start + ROLES_PER_PAGE).map((job, index) => (
          <RoleCard key={job.id} job={job} number={start + index + 1} />
        ))}
      </ol>

      <Pager label="Experience pages" pages={pages} current={current} onChange={go} />
    </Section>
  );
}
