'use client';

import { useState } from 'react';
import {
  ExternalLink as LinkIcon,
  FileText,
  Flag,
  FlaskConical,
  Medal,
  Rocket,
  Sparkles,
  Star,
  Trophy,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { mediaGallery } from '@/lib/caseStudy';
import { isPdf, mediaDownloadUrl, mediaUrl } from '@/lib/media';
import type { Achievement, AchievementCategory } from '@/lib/types';
import Gallery from './case/Gallery';
import ExternalLink from './ExternalLink';
import Markdown from './Markdown';
import Modal from './Modal';
import { usePortfolio } from './PortfolioProvider';
import Section from './Section';

const CATEGORY_ICONS: Record<AchievementCategory, LucideIcon> = {
  hackathon: Rocket,
  competition: Medal,
  award: Trophy,
  research: FlaskConical,
  milestone: Flag,
  recognition: Star,
  other: Sparkles,
};

const CATEGORY_ORDER: AchievementCategory[] = [
  'award',
  'hackathon',
  'competition',
  'research',
  'milestone',
  'recognition',
  'other',
];

const hasDetail = (item: Achievement) =>
  Boolean(
    item.background ||
      item.impact ||
      (item.media && item.media.length > 0) ||
      (item.links && item.links.length > 0) ||
      item.description.length > 220
  );

function AchievementWindow({ item, onClose }: { item: Achievement | null; onClose: () => void }) {
  const { t } = usePortfolio();
  const gallery = item ? mediaGallery(item.media, item.title) : [];
  const documents = (item?.media ?? []).filter((file) => isPdf(file));
  const meta = item ? [item.organization, item.date].filter(Boolean).join(' · ') : '';
  const label = (category: AchievementCategory) => t(`ach.cat.${category}`);

  return (
    <Modal
      open={Boolean(item)}
      onClose={onClose}
      size="lg"
      fullOnMobile
      title={item?.title ?? ''}
      description={meta || undefined}
    >
      {item && (
        <div className="space-y-8">
          {item.category && (
            <p>
              <span className="chip">{label(item.category)}</span>
            </p>
          )}
          {gallery.length > 0 && <Gallery items={gallery} title={item.title} />}
          {item.description && <Markdown source={item.description} headingOffset={3} />}
          {item.background && (
            <section aria-labelledby="ach-background">
              <h3
                id="ach-background"
                className="text-ink mb-3 text-xl font-semibold tracking-tight"
              >
                {t('ach.background')}
              </h3>
              <Markdown source={item.background} headingOffset={3} />
            </section>
          )}
          {item.impact && (
            <section aria-labelledby="ach-impact">
              <h3 id="ach-impact" className="text-ink mb-3 text-xl font-semibold tracking-tight">
                {t('ach.impact')}
              </h3>
              <Markdown source={item.impact} headingOffset={3} />
            </section>
          )}
          {documents.length > 0 && (
            <section aria-labelledby="ach-files">
              <h3 id="ach-files" className="text-ink mb-3 text-xl font-semibold tracking-tight">
                {t('ach.files')}
              </h3>
              <ul className="space-y-2">
                {documents.map((file) => (
                  <li
                    key={file.id}
                    className="border-line bg-surface flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 text-sm"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <FileText aria-hidden="true" className="text-muted h-5 w-5 shrink-0" />
                      <span className="text-ink min-w-0 truncate font-medium">
                        {file.caption || file.name}
                      </span>
                    </span>
                    <span className="flex gap-2">
                      <ExternalLink
                        href={mediaUrl(file.path)}
                        showIcon={false}
                        className="btn-ghost !min-h-9"
                      >
                        {t('certs.openFile')}
                      </ExternalLink>
                      <a href={mediaDownloadUrl(file.path)} className="btn-ghost !min-h-9">
                        {t('certs.download')}
                      </a>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {item.links && item.links.length > 0 && (
            <section aria-labelledby="ach-links">
              <h3 id="ach-links" className="text-ink mb-3 text-xl font-semibold tracking-tight">
                {t('ach.links')}
              </h3>
              <ul className="flex flex-wrap gap-2">
                {item.links.map((link) => (
                  <li key={link.url}>
                    <ExternalLink href={link.url} showIcon={false} className="btn-secondary">
                      <LinkIcon aria-hidden="true" className="h-4 w-4" />
                      {link.label}
                    </ExternalLink>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </Modal>
  );
}

export default function Achievements({ number }: { number: string }) {
  const { content, t } = usePortfolio();
  const items = content.achievements;
  const [filter, setFilter] = useState<AchievementCategory | 'all'>('all');
  const [open, setOpen] = useState<number | null>(null);

  const present = CATEGORY_ORDER.filter((category) =>
    items.some((item) => item.category === category)
  );
  const shown = items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => filter === 'all' || item.category === filter);

  return (
    <Section id="achievements" number={number}>
      {present.length > 1 && (
        <div
          role="group"
          aria-label="Filter achievements by category"
          className="mb-8 flex flex-wrap gap-2"
        >
          <button
            type="button"
            className="pill"
            aria-pressed={filter === 'all'}
            onClick={() => setFilter('all')}
          >
            {t('ach.all')}
            <span className="tabular-nums opacity-80">{items.length}</span>
          </button>
          {present.map((category) => (
            <button
              key={category}
              type="button"
              className="pill"
              aria-pressed={filter === category}
              onClick={() => setFilter(category)}
            >
              {t(`ach.cat.${category}`)}
              <span className="tabular-nums opacity-80">
                {items.filter((item) => item.category === category).length}
              </span>
            </button>
          ))}
        </div>
      )}

      <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {shown.map(({ item, index }) => {
          const Icon = CATEGORY_ICONS[item.category ?? 'award'];
          const cover = mediaGallery(item.media, item.title)[0];
          const meta = [item.organization, item.date].filter(Boolean).join(' · ');
          const detail = hasDetail(item);
          return (
            <li
              key={`${item.title}-${index}`}
              id={`achievement-${index}`}
              data-flash
              className="card card-hover flex flex-col overflow-hidden"
            >
              {cover && (
                <button
                  type="button"
                  onClick={() => setOpen(index)}
                  aria-haspopup="dialog"
                  aria-label={`${t('ach.details')}: ${item.title}`}
                  className="border-line bg-surface block h-40 w-full overflow-hidden border-b"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cover.src}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                </button>
              )}
              <div className="flex flex-1 flex-col p-6">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                    <Icon aria-hidden="true" className="h-5 w-5" />
                  </span>
                  {item.category && <span className="chip">{t(`ach.cat.${item.category}`)}</span>}
                </div>
                <h3 className="text-ink mt-5 leading-snug font-semibold tracking-tight">
                  {item.title}
                </h3>
                {meta && <p className="text-subtle mt-1 text-xs">{meta}</p>}
                {item.description && (
                  <div className="text-muted mt-2 text-sm leading-relaxed">
                    <Markdown source={item.description} headingOffset={3} className="[&_p]:my-0" />
                  </div>
                )}
                {detail && (
                  <div className="mt-auto pt-5">
                    <button
                      type="button"
                      onClick={() => setOpen(index)}
                      aria-haspopup="dialog"
                      className="btn-ghost text-accent-ink !min-h-9 !px-0"
                    >
                      {t('ach.details')}
                      <span className="sr-only">: {item.title}</span>
                    </button>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <AchievementWindow
        item={open === null ? null : (items[open] ?? null)}
        onClose={() => setOpen(null)}
      />
    </Section>
  );
}
