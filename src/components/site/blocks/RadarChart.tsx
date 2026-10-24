'use client';

import { usePortfolio } from '../PortfolioProvider';

const CENTER = 50;
const RADIUS = 34;

const point = (angleDeg: number, ratio: number) => {
  const a = (angleDeg * Math.PI) / 180;
  // rounded: sin and cos can differ in their last digits between browsers, which would upset hydration
  const round = (n: number) => Math.round(n * 100) / 100;
  return {
    x: round(CENTER + Math.cos(a) * RADIUS * ratio),
    y: round(CENTER + Math.sin(a) * RADIUS * ratio),
  };
};

// How my skills and projects spread across my roles. Select a role to see its projects.
// The radar needs at least three roles; with fewer, and on phones, simple bars read better.
export default function RadarChart() {
  const { model, role, showProjects, t } = usePortfolio();
  const axes = model.radar;
  if (axes.length === 0) return null;

  // the first role sits at the top, the others follow clockwise
  const angles = axes.map((_, i) => -90 + (360 / axes.length) * i);
  const polygon = (ratios: number[]) =>
    ratios
      .map((r, i) => point(angles[i], r))
      .map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`)
      .join(' ');
  const useRadar = axes.length >= 3;
  const label = `${t('chart.radar.title')}`;

  return (
    <div>
      {useRadar && (
        <svg
          viewBox="-28 -4 156 112"
          role="group"
          aria-label={label}
          className="hidden h-auto w-full sm:block"
        >
          <g aria-hidden="true" fill="none" stroke="var(--color-line-strong)" strokeWidth="0.3">
            {[0.25, 0.5, 0.75, 1].map((ring) => (
              <polygon key={ring} points={polygon(axes.map(() => ring))} />
            ))}
            {angles.map((angle) => {
              const end = point(angle, 1);
              return <line key={angle} x1={CENTER} y1={CENTER} x2={end.x} y2={end.y} />;
            })}
          </g>

          <polygon
            points={polygon(axes.map((a) => a.skillsNorm))}
            fill="none"
            stroke="var(--color-muted)"
            strokeWidth="0.7"
            strokeDasharray="1.6 1.2"
            aria-hidden="true"
          />
          <polygon
            points={polygon(axes.map((a) => a.projectsNorm))}
            fill="var(--color-accent)"
            fillOpacity="0.22"
            stroke="var(--color-accent-ink)"
            strokeWidth="0.9"
            aria-hidden="true"
          />

          {axes.map((axis, i) => {
            const dot = point(angles[i], Math.max(axis.projectsNorm, 0.04));
            const labelPoint = point(angles[i], 1.26);
            const cos = Math.cos((angles[i] * Math.PI) / 180);
            const anchor = cos > 0.3 ? 'start' : cos < -0.3 ? 'end' : 'middle';
            const selected = role === axis.id;
            const description = `${axis.label}: ${axis.skills} skill${axis.skills === 1 ? '' : 's'}, ${axis.projects} project${axis.projects === 1 ? '' : 's'}`;
            return (
              <g
                key={axis.id}
                role="button"
                tabIndex={0}
                aria-label={`${description}. Show these projects`}
                aria-pressed={selected}
                onClick={() => showProjects({ role: axis.id })}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    showProjects({ role: axis.id });
                  }
                }}
                style={{ cursor: 'pointer', outline: 'none' }}
              >
                <title>{description}</title>
                <circle
                  cx={dot.x}
                  cy={dot.y}
                  r="1.7"
                  fill="var(--color-accent-ink)"
                  stroke="var(--color-card)"
                  strokeWidth="0.5"
                />
                <text
                  x={labelPoint.x}
                  y={labelPoint.y}
                  textAnchor={anchor}
                  fontSize="3.8"
                  fontWeight={selected ? 700 : 600}
                  fill={selected ? 'var(--color-accent-ink)' : 'var(--color-ink)'}
                >
                  {axis.label}
                </text>
                <text
                  x={labelPoint.x}
                  y={labelPoint.y + 4.6}
                  textAnchor={anchor}
                  fontSize="3"
                  fill="var(--color-muted)"
                >
                  {axis.projects} project{axis.projects === 1 ? '' : 's'} · {axis.skills} skill
                  {axis.skills === 1 ? '' : 's'}
                </text>
              </g>
            );
          })}
        </svg>
      )}

      <ul className={`space-y-4 ${useRadar ? 'sm:hidden' : ''}`} aria-label={label}>
        {axes.map((axis) => (
          <li key={axis.id} data-track={model.roles.palette(axis.id)}>
            <button
              type="button"
              onClick={() => showProjects({ role: axis.id })}
              aria-pressed={role === axis.id}
              className="block w-full text-left"
            >
              <span className="flex items-baseline justify-between gap-3">
                <span className="text-ink font-semibold">{axis.label}</span>
                <span className="text-muted text-xs">
                  {axis.projects} project{axis.projects === 1 ? '' : 's'} · {axis.skills} skill
                  {axis.skills === 1 ? '' : 's'}
                </span>
              </span>
              <span
                className="bg-line mt-1.5 block h-2.5 overflow-hidden rounded-full"
                aria-hidden="true"
              >
                <span
                  className="block h-full rounded-full"
                  style={{
                    width: `${Math.max(axis.projectsNorm * 100, axis.projects ? 6 : 0)}%`,
                    backgroundColor: 'var(--track-dot)',
                  }}
                />
              </span>
              <span
                className="bg-line mt-1 block h-1.5 overflow-hidden rounded-full"
                aria-hidden="true"
              >
                <span
                  className="block h-full rounded-full opacity-45"
                  style={{
                    width: `${Math.max(axis.skillsNorm * 100, axis.skills ? 6 : 0)}%`,
                    backgroundColor: 'var(--track-dot)',
                  }}
                />
              </span>
            </button>
          </li>
        ))}
        <li className="text-muted flex gap-4 text-xs" aria-hidden="true">
          <span className="inline-flex items-center gap-1.5">
            <span className="bg-accent-ink h-2 w-5 rounded-full" />
            Projects
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="bg-accent-ink h-1.5 w-5 rounded-full opacity-45" />
            Skills
          </span>
        </li>
      </ul>

      {useRadar && (
        <ul
          className="text-muted mt-3 hidden flex-wrap gap-x-5 gap-y-1 text-xs sm:flex"
          aria-label="Chart key"
        >
          <li className="inline-flex items-center gap-2">
            <span
              aria-hidden="true"
              className="border-accent-ink bg-accent/25 h-2.5 w-4 rounded-sm border"
            />
            Projects
          </li>
          <li className="inline-flex items-center gap-2">
            <span aria-hidden="true" className="border-muted h-0 w-4 border-t-2 border-dashed" />
            Skills
          </li>
        </ul>
      )}
    </div>
  );
}
