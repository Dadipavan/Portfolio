'use client';

import { useMemo, useState } from 'react';
import { Award, Briefcase, GraduationCap, Layers } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { scrollAndFlash } from '@/lib/dom';
import type { TimelineItem, TimelineType } from '@/lib/timeline';
import Section from './Section';
import { usePortfolio } from './PortfolioProvider';

const TYPES: {
  id: TimelineType;
  section: 'experience' | 'education' | 'projects' | 'certifications';
  icon: LucideIcon;
}[] = [
  { id: 'experience', section: 'experience', icon: Briefcase },
  { id: 'education', section: 'education', icon: GraduationCap },
  { id: 'project', section: 'projects', icon: Layers },
  { id: 'certification', section: 'certifications', icon: Award },
];

// One timeline of everything, newest first. Select an item to jump to its full details.
export default function TimelineSection({ number }: { number: string }) {
  const { model, role, t } = usePortfolio();
  const { roles } = model;
  const [type, setType] = useState<TimelineType | 'all'>('all');

  const items = useMemo(
    () => model.timeline.filter((item) => type === 'all' || item.type === type),
    [model.timeline, type]
  );
  const groups = useMemo(() => {
    const byYear = new Map<number, TimelineItem[]>();
    items.forEach((item) =>
      byYear.set(item.startYear, [...(byYear.get(item.startYear) ?? []), item])
    );
    return Array.from(byYear.entries()).sort((a, b) => b[0] - a[0]);
  }, [items]);

  const chosen = roles.get(role);
  const matchesRole = (item: TimelineItem) => {
    if (!chosen) return true;
    if (item.type === 'project') return item.tracks.includes(chosen.id);
    if (item.type === 'certification')
      return item.skills.some((s) => roles.skillMatches(s, chosen.id));
    return true;
  };

  return (
    <Section id="timeline" number={number}>
      <div role="group" aria-label="Filter the timeline" className="mb-8 flex flex-wrap gap-2">
        <button
          type="button"
          className="pill"
          aria-pressed={type === 'all'}
          onClick={() => setType('all')}
        >
          {t('timeline.all')}
          <span className="tabular-nums opacity-80">{model.timeline.length}</span>
        </button>
        {TYPES.map(({ id, section }) => {
          const count = model.timeline.filter((i) => i.type === id).length;
          if (count === 0) return null;
          return (
            <button
              key={id}
              type="button"
              className="pill"
              aria-pressed={type === id}
              onClick={() => setType(id)}
            >
              {t(`section.${section}.label`)}
              <span className="tabular-nums opacity-80">{count}</span>
            </button>
          );
        })}
      </div>
      {chosen && <p className="text-muted mb-6 text-sm">{t('timeline.dim')}</p>}

      <ol className="before:bg-line-strong relative space-y-10 before:absolute before:top-2 before:bottom-2 before:left-[0.4375rem] before:w-px sm:before:left-[4.9375rem]">
        {groups.map(([year, yearItems]) => (
          <li key={year} className="relative sm:grid sm:grid-cols-[4rem_minmax(0,1fr)]">
            <h3 className="text-ink mb-3 pl-6 font-mono text-lg font-semibold tabular-nums sm:mb-0 sm:pt-1 sm:pr-3 sm:pl-0 sm:text-right">
              <span
                aria-hidden="true"
                className="border-accent bg-page absolute top-2 left-0 h-3.5 w-3.5 rounded-full border-[3px] sm:top-3 sm:left-[4.5rem]"
              />
              {year}
            </h3>
            <ul className="space-y-3 pl-6 sm:pl-9">
              {yearItems.map((item) => {
                const kind = TYPES.find((entry) => entry.id === item.type)!;
                const Icon = kind.icon;
                const dim = !matchesRole(item);
                return (
                  <li key={item.id} className={dim ? 'opacity-45' : ''}>
                    <button
                      type="button"
                      onClick={() => scrollAndFlash(item.id)}
                      className="card card-hover flex w-full items-start gap-3 p-4 text-left"
                      title="Jump to the details"
                    >
                      <span className="bg-accent-soft text-accent-ink flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                        <Icon aria-hidden="true" className="h-[18px] w-[18px]" />
                      </span>
                      <span className="min-w-0">
                        <span className="text-ink block leading-snug font-medium">
                          {item.title}
                        </span>
                        <span className="text-muted block text-sm">{item.subtitle}</span>
                        <span className="text-subtle mt-0.5 block font-mono text-xs">
                          {t(`section.${kind.section}.label`).replace(/s$/, '')} · {item.label}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ol>
    </Section>
  );
}
