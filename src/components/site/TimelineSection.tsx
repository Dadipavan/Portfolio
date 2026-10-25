'use client';

import { useMemo, useState } from 'react';
import { Award, Briefcase, ChevronDown, GraduationCap, Layers } from 'lucide-react';
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
  // the years that are open: only the newest one at first
  const [openYears, setOpenYears] = useState<Set<number>>(
    () =>
      new Set(model.timeline.length ? [Math.max(...model.timeline.map((i) => i.startYear))] : [])
  );

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

  // switching the filter opens the newest year of what is left, so the list is never all closed
  const showType = (next: TimelineType | 'all') => {
    setType(next);
    const years = model.timeline
      .filter((item) => next === 'all' || item.type === next)
      .map((item) => item.startYear);
    if (years.length) setOpenYears(new Set([Math.max(...years)]));
  };

  const toggleYear = (year: number) =>
    setOpenYears((current) => {
      const next = new Set(current);
      if (!next.delete(year)) next.add(year);
      return next;
    });
  const allOpen = groups.length > 0 && groups.every(([year]) => openYears.has(year));

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
          onClick={() => showType('all')}
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
              onClick={() => showType(id)}
            >
              {t(`section.${section}.label`)}
              <span className="tabular-nums opacity-80">{count}</span>
            </button>
          );
        })}
      </div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted text-sm">
          {chosen
            ? t('timeline.dim')
            : `${groups.length} ${groups.length === 1 ? 'year' : 'years'}, ${items.length} ${items.length === 1 ? 'milestone' : 'milestones'}`}
        </p>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => setOpenYears(allOpen ? new Set() : new Set(groups.map(([year]) => year)))}
        >
          {allOpen ? t('timeline.collapse') : t('timeline.expand')}
        </button>
      </div>

      <ol className="before:bg-line-strong relative space-y-10 before:absolute before:top-2 before:bottom-2 before:left-[0.4375rem] before:w-px sm:before:left-[4.9375rem]">
        {groups.map(([year, yearItems]) => {
          const isOpen = openYears.has(year);
          const panel = `timeline-year-${year}`;
          const kinds = Array.from(new Set(yearItems.map((item) => item.type)));
          return (
            <li
              key={year}
              className="timeline-year relative sm:grid sm:grid-cols-[4rem_minmax(0,1fr)]"
            >
              <span
                aria-hidden="true"
                className={`border-accent absolute top-2 left-0 h-3.5 w-3.5 rounded-full border-[3px] sm:top-3 sm:left-[4.5rem] ${isOpen ? 'bg-accent' : 'bg-page'}`}
              />
              <h3 className="mb-3 pl-6 sm:col-span-2 sm:mb-0 sm:grid sm:grid-cols-subgrid sm:pl-0">
                <button
                  type="button"
                  onClick={() => toggleYear(year)}
                  aria-expanded={isOpen}
                  aria-controls={panel}
                  className="group text-left sm:contents"
                >
                  <span className="text-ink font-mono text-lg font-semibold tabular-nums sm:pt-1 sm:pr-3 sm:text-right">
                    {year}
                  </span>
                  <span className="card card-hover flex items-center gap-3 px-4 py-3 sm:ml-9">
                    <span className="flex shrink-0 -space-x-1.5" aria-hidden="true">
                      {kinds.map((kindId) => {
                        const Icon = TYPES.find((entry) => entry.id === kindId)!.icon;
                        return (
                          <span
                            key={kindId}
                            className="bg-accent-soft text-accent-ink border-card flex h-7 w-7 items-center justify-center rounded-full border-2"
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                        );
                      })}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="text-ink block truncate text-sm font-medium">
                        {yearItems[0].title}
                        {yearItems.length > 1 && (
                          <span className="text-muted font-normal">
                            {' '}
                            + {yearItems.length - 1} more
                          </span>
                        )}
                      </span>
                      <span className="text-subtle block font-mono text-xs">
                        {yearItems.length} {yearItems.length === 1 ? 'milestone' : 'milestones'}
                      </span>
                    </span>
                    <ChevronDown
                      aria-hidden="true"
                      className={`text-muted h-5 w-5 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </span>
                </button>
              </h3>
              {/* always on the page (the year button points at it); hidden while the year is closed */}
              <ul
                id={panel}
                hidden={!isOpen}
                className="timeline-open mt-3 space-y-3 pl-6 sm:col-start-2 sm:pl-9"
              >
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
          );
        })}
      </ol>
    </Section>
  );
}
