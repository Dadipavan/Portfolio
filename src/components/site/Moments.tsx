'use client';

// Moments: pictures with a few words, grouped by year. Hover (or focus) a picture to read the words; select it,
// or tap on a phone, to open it larger. Everything comes from Admin > Moments.
import { useState } from 'react';
import { ExternalLink as LinkIcon, Sparkles } from 'lucide-react';
import { groupByYear } from '@/lib/moments';
import { mediaUrl } from '@/lib/media';
import type { Moment } from '@/lib/types';
import ExternalLink from './ExternalLink';
import Modal from './Modal';
import { usePortfolio } from './PortfolioProvider';
import Section from './Section';

export function MomentWindow({ moment, onClose }: { moment: Moment | null; onClose: () => void }) {
  return (
    <Modal open={Boolean(moment)} onClose={onClose} title={moment?.title ?? ''} description={moment?.year || undefined}>
      {moment && (
        <div className="space-y-5">
          {moment.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mediaUrl(moment.image.path)}
              alt={moment.imageAlt ?? moment.title}
              className="border-line max-h-[60vh] w-full rounded-xl border object-contain"
            />
          )}
          {moment.text && <p className="text-muted leading-relaxed whitespace-pre-line">{moment.text}</p>}
          {moment.link && (
            <ExternalLink href={moment.link.url} showIcon={false} className="btn-secondary">
              <LinkIcon aria-hidden="true" className="h-4 w-4" />
              {moment.link.label}
            </ExternalLink>
          )}
        </div>
      )}
    </Modal>
  );
}

export default function Moments({ number }: { number: string }) {
  const { content, t } = usePortfolio();
  const groups = groupByYear(content.moments);
  const [open, setOpen] = useState<Moment | null>(null);

  return (
    <Section id="moments" number={number}>
      <div className="space-y-12">
        {groups.map((group) => (
          <div key={group.year || 'other'}>
            <h3 className="mb-5 flex items-center gap-4">
              <span className="text-ink font-mono text-2xl font-semibold tabular-nums">{group.year || '—'}</span>
              <span aria-hidden="true" className="bg-line h-px flex-1" />
            </h3>
            <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((moment) => (
                <li key={String(moment.id)} data-flash>
                  <button
                    type="button"
                    onClick={() => setOpen(moment)}
                    aria-haspopup="dialog"
                    aria-label={`${t('moments.open')}: ${moment.title}`}
                    className="group border-line bg-surface relative block aspect-[4/3] w-full overflow-hidden rounded-2xl border text-left"
                  >
                    {moment.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={mediaUrl(moment.image.path)}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 group-focus-visible:scale-105"
                      />
                    ) : (
                      <span className="bg-accent/10 text-accent flex h-full w-full items-center justify-center">
                        <Sparkles aria-hidden="true" className="h-10 w-10" />
                      </span>
                    )}
                    <span className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/25 to-transparent p-4 text-white">
                      <span className="font-semibold leading-snug">{moment.title}</span>
                      {moment.text && (
                        <span className="mt-0 line-clamp-4 max-h-0 overflow-hidden text-sm leading-relaxed opacity-0 transition-all duration-300 group-hover:mt-1.5 group-hover:max-h-32 group-hover:opacity-100 group-focus-visible:mt-1.5 group-focus-visible:max-h-32 group-focus-visible:opacity-100">
                          {moment.text}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <MomentWindow moment={open} onClose={() => setOpen(null)} />
    </Section>
  );
}
