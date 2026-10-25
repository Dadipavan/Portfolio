'use client';

import { useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { skillIconFor } from '@/lib/skillIcons';
import { isLinkable, tagKey } from '@/lib/tags';
import type { RoleId } from '@/lib/types';
import Section from './Section';
import { usePortfolio } from './PortfolioProvider';

// skills shown in a card before "Show all"
const PREVIEW = 10;

// Skills by category. The role tabs are the same "View as" choice used across the page.
export default function SkillsBrowser({ number }: { number: string }) {
  const { content, model, role, setRole, openTag, settings, t } = usePortfolio();
  const { roles } = model;
  const categories = content.technicalSkills;
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const chosen = roles.get(role);
  const options = roles.switchOptions;
  const total = categories.reduce((sum, c) => sum + c.skills.length, 0);
  const counts = new Map<RoleId, number>([['all', total]]);
  roles.list.forEach((r) =>
    counts.set(
      r.id,
      categories.reduce(
        (sum, c) => sum + c.skills.filter((s) => roles.skillMatches(s, r.id)).length,
        0
      )
    )
  );

  const shown = categories
    .map((category) => ({
      ...category,
      skills: chosen
        ? category.skills.filter((skill) => roles.skillMatches(skill, chosen.id))
        : category.skills,
    }))
    .filter((category) => category.skills.length > 0);

  const hasLinks = shown.some((c) => c.skills.some((s) => model.techUsage[tagKey(s)]));

  // Arrow keys move between tabs (ARIA tabs pattern)
  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    const last = options.length - 1;
    let next = index;
    if (event.key === 'ArrowRight') next = index === last ? 0 : index + 1;
    else if (event.key === 'ArrowLeft') next = index === 0 ? last : index - 1;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = last;
    else return;
    event.preventDefault();
    setRole(options[next]);
    tabRefs.current[next]?.focus();
  };

  return (
    <Section id="skills" number={number}>
      <div role="tablist" aria-label="Skills by role" className="flex flex-wrap gap-2">
        {options.map((id, index) => {
          const selected = role === id;
          return (
            <button
              key={id}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              role="tab"
              id={`skills-tab-${id}`}
              aria-selected={selected}
              aria-controls="skills-panel"
              tabIndex={selected ? 0 : -1}
              onClick={() => setRole(id)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className="pill"
            >
              {id === 'all' ? t('skills.all') : roles.title(id)}
              <span className="tabular-nums opacity-80">{counts.get(id)}</span>
            </button>
          );
        })}
      </div>

      <div
        id="skills-panel"
        role="tabpanel"
        aria-labelledby={`skills-tab-${role}`}
        tabIndex={0}
        className="mt-8"
      >
        {hasLinks && (
          <p className="text-muted mb-5 text-sm">
            {t('skills.hintCount')}{' '}
            {settings.features.explorer ? t('skills.hintExplorer') : t('skills.hintProjects')}
          </p>
        )}

        {shown.length > 0 ? (
          <div className="gap-6 sm:columns-2 lg:columns-3">
            {shown.map((category) => {
              const Icon = skillIconFor(category.category);
              const open = expanded.has(category.category);
              const visible = open ? category.skills : category.skills.slice(0, PREVIEW);
              const hiddenCount = category.skills.length - visible.length;
              return (
                <div
                  key={category.category}
                  className="skill-card card relative mb-6 break-inside-avoid overflow-hidden p-5 sm:p-6"
                >
                  <span aria-hidden="true" className="bg-accent/70 absolute inset-x-0 top-0 h-1" />
                  <h3 className="text-ink flex items-center gap-3 font-semibold">
                    <span
                      aria-hidden="true"
                      className="skill-icon border-line bg-surface text-accent-ink flex h-10 w-10 shrink-0 items-center justify-center rounded-full border"
                    >
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                    <span className="min-w-0 flex-1 leading-snug">{category.category}</span>
                    <span className="text-subtle font-mono text-xs tabular-nums">
                      {category.skills.length}
                    </span>
                  </h3>
                  <ul className="mt-5 flex flex-wrap gap-2">
                    {visible.map((skill) => {
                      const used = model.techUsage[tagKey(skill)];
                      const interactive =
                        isLinkable(model.evidence, skill) &&
                        (settings.features.explorer || Boolean(used));
                      return (
                        <li key={skill}>
                          {interactive ? (
                            <button
                              type="button"
                              onClick={() => openTag(skill)}
                              aria-haspopup={settings.features.explorer ? 'dialog' : undefined}
                              aria-label={
                                used
                                  ? `${skill}, used in ${used.count} project${used.count === 1 ? '' : 's'}. Show details`
                                  : `${skill}. Show details`
                              }
                              className="tag"
                            >
                              {skill}
                              {used && (
                                <span className="bg-accent-soft text-accent-soft-ink rounded px-1.5 text-[11px] font-semibold tabular-nums">
                                  {used.count}
                                </span>
                              )}
                            </button>
                          ) : (
                            <span className="chip">{skill}</span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                  {(hiddenCount > 0 || open) && category.skills.length > PREVIEW && (
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() =>
                        setExpanded((current) => {
                          const next = new Set(current);
                          if (!next.delete(category.category)) next.add(category.category);
                          return next;
                        })
                      }
                      className="text-accent-ink mt-4 inline-flex items-center gap-1 text-sm font-medium hover:underline"
                    >
                      {open ? 'Show fewer' : `Show all ${category.skills.length}`}
                      <ChevronDown
                        aria-hidden="true"
                        className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
                      />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-muted">{t('skills.empty')}</p>
        )}
      </div>
    </Section>
  );
}
