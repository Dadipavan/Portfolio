'use client';

import { usePortfolio } from '../PortfolioProvider';

// Projects per year. Select a bar to see that year's projects.
export default function YearChart() {
  const { model, filters, showProjects } = usePortfolio();
  const years = model.years;
  if (years.length === 0) return null;

  const max = Math.max(1, ...years.map((y) => y.count));
  const left = 8;
  const right = 98;
  const top = 8;
  const bottom = 40;
  const slot = (right - left) / years.length;
  const barWidth = Math.min(slot * 0.62, 16);

  return (
    <svg viewBox="0 0 100 50" role="group" aria-label="Projects per year" className="h-auto w-full">
      <g aria-hidden="true" stroke="var(--color-line)" strokeWidth="0.3">
        {Array.from({ length: max + 1 }, (_, i) => i).map((tick) => {
          const y = bottom - ((bottom - top) * tick) / max;
          return (
            <g key={tick}>
              <line x1={left} y1={y} x2={right} y2={y} />
              <text
                x={left - 1.5}
                y={y + 1}
                textAnchor="end"
                fontSize="2.8"
                fill="var(--color-muted)"
                stroke="none"
              >
                {tick}
              </text>
            </g>
          );
        })}
      </g>

      {years.map((datum, i) => {
        const height = ((bottom - top) * datum.count) / max;
        const x = left + slot * i + (slot - barWidth) / 2;
        const selected = filters.year === datum.year;
        const description = `${datum.year}: ${datum.count} project${datum.count === 1 ? '' : 's'}`;
        return (
          <g
            key={datum.year}
            role="button"
            tabIndex={datum.count > 0 ? 0 : -1}
            aria-label={datum.count > 0 ? `${description}. Show them` : description}
            aria-pressed={selected}
            onClick={() => datum.count > 0 && showProjects({ year: selected ? 'all' : datum.year })}
            onKeyDown={(event) => {
              if ((event.key === 'Enter' || event.key === ' ') && datum.count > 0) {
                event.preventDefault();
                showProjects({ year: selected ? 'all' : datum.year });
              }
            }}
            style={{ cursor: datum.count > 0 ? 'pointer' : 'default', outline: 'none' }}
          >
            <title>{`${description}${datum.projects.length ? `: ${datum.projects.map((p) => p.title).join(', ')}` : ''}`}</title>
            <rect
              x={left + slot * i}
              y={top - 4}
              width={slot}
              height={bottom - top + 14}
              fill="transparent"
            />
            {datum.count > 0 && (
              <rect
                x={x}
                y={bottom - height}
                width={barWidth}
                height={height}
                rx="1.2"
                fill={selected ? 'var(--color-accent-strong)' : 'var(--color-accent)'}
                opacity={filters.year !== 'all' && !selected ? 0.35 : 1}
              />
            )}
            {datum.count > 0 && (
              <text
                x={x + barWidth / 2}
                y={bottom - height - 1.5}
                textAnchor="middle"
                fontSize="3"
                fontWeight="700"
                fill="var(--color-ink)"
              >
                {datum.count}
              </text>
            )}
            <text
              x={x + barWidth / 2}
              y={bottom + 5.5}
              textAnchor="middle"
              fontSize="3"
              fill="var(--color-muted)"
            >
              {datum.year}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
