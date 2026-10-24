'use client';

import { ArrowRight } from 'lucide-react';
import { usePortfolio } from '../PortfolioProvider';
import RoleIcon from '../RoleIcon';

// The roles as a data pipeline. Choosing one shows its projects (or its skills when it has no
// projects yet). With the pipeline look switched off it is a plain list of roles.
export default function RolePipeline({ className = '' }: { className?: string }) {
  const { model, role, showProjects, showSkills, settings } = usePortfolio();
  const pipeline = settings.features.pipelineMotif;
  const stats = model.roleStats;
  if (stats.length === 0) return null;

  // two across until there is room for four; a longer list simply wraps
  const perRow = stats.length <= 2 ? 2 : stats.length === 3 ? 3 : 4;
  const columns =
    perRow === 2 ? 'lg:grid-cols-2' : perRow === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4';

  return (
    <div className={`role-pipeline ${className}`}>
      <ol className={`relative grid grid-cols-2 gap-3 ${columns}`}>
        {stats.map((stat, index) => {
          const hasProjects = stat.projectCount > 0;
          const selected = role === stat.id;
          const showStage = pipeline && stat.stage;
          const joined = pipeline && index < stats.length - 1 && (index + 1) % perRow !== 0;
          return (
            <li
              key={stat.id}
              data-track={model.roles.palette(stat.id)}
              className="relative max-lg:[&:last-child:nth-child(odd)]:col-span-2"
            >
              {joined && (
                <svg
                  aria-hidden="true"
                  className="absolute top-[1.65rem] -right-3 z-10 hidden h-3 w-6 lg:block"
                  viewBox="0 0 24 12"
                >
                  <line
                    x1="0"
                    y1="6"
                    x2="24"
                    y2="6"
                    stroke="var(--color-line-strong)"
                    strokeWidth="2"
                    className="pipeline-flow"
                  />
                </svg>
              )}
              <button
                type="button"
                onClick={() =>
                  hasProjects ? showProjects({ role: stat.id, tech: 'all' }) : showSkills(stat.id)
                }
                aria-pressed={selected}
                aria-label={`${stat.label}${showStage ? `, ${stat.stage}` : ''}: ${
                  hasProjects
                    ? `${stat.projectCount} project${stat.projectCount === 1 ? '' : 's'}`
                    : 'no projects yet'
                }. ${hasProjects ? 'Show projects' : 'Show skills'}`}
                className="card card-hover group flex h-full w-full flex-col p-3.5 text-left sm:p-4"
                style={selected ? { borderColor: 'var(--track-dot)' } : undefined}
              >
                <span className="flex flex-col items-start gap-2.5 sm:flex-row sm:items-center sm:gap-3">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border"
                    style={{
                      color: 'var(--track-fg)',
                      backgroundColor: 'var(--track-bg)',
                      borderColor: 'var(--track-line)',
                    }}
                  >
                    <RoleIcon id={stat.id} className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    {showStage && (
                      <span className="mono-label block">{`${String(index + 1).padStart(2, '0')} · ${stat.stage}`}</span>
                    )}
                    <span className="text-ink block font-semibold tracking-tight">
                      {stat.label}
                    </span>
                  </span>
                </span>
                {stat.blurb && (
                  <span className="text-muted mt-2.5 block text-xs leading-snug sm:mt-3 sm:text-sm">
                    {stat.blurb}
                  </span>
                )}
                {stat.highlights.length > 0 && (
                  <span className="mt-3 hidden flex-wrap gap-1.5 sm:flex">
                    {stat.highlights.map((item) => (
                      <span key={item} className="chip px-2 py-0.5">
                        {item}
                      </span>
                    ))}
                  </span>
                )}
                <span className="text-muted mt-auto flex items-center justify-between gap-2 pt-3 text-xs font-medium sm:pt-4">
                  <span className="tabular-nums">
                    {hasProjects
                      ? `${stat.projectCount} project${stat.projectCount === 1 ? '' : 's'}`
                      : 'Skills only so far'}
                  </span>
                  <ArrowRight
                    aria-hidden="true"
                    className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                  />
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
