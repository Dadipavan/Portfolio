'use client';

import { useState } from 'react';
import { fitBubbleLabel } from '@/lib/charts';
import { usePortfolio } from '../PortfolioProvider';

// Technologies as bubbles, coloured by role. Select one to filter the projects.
// Wide screens get the bubble picture; phones get a tag cloud that stays readable at any width.
export default function TechMap() {
  const { model, filters, showProjects } = usePortfolio();
  const { bubbles, width, height } = model.techMap;
  const [hover, setHover] = useState<string | null>(null);
  if (bubbles.length === 0) return null;

  const present = new Set(bubbles.map((b) => b.track));
  const isSelected = (label: string) =>
    filters.tech !== 'all' && filters.tech.toLowerCase() === label.toLowerCase();
  const choose = (label: string) =>
    showProjects({ tech: isSelected(label) ? 'all' : label, role: 'all' });

  return (
    <div>
      {/* tablets and larger: the bubble picture */}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="group"
        aria-label={`Technology map: ${bubbles.length} technologies`}
        className="hidden h-auto w-full md:block"
      >
        {bubbles.map((bubble) => {
          const selected = isSelected(bubble.label);
          const fit = fitBubbleLabel(bubble.label, bubble.r);
          const lineHeight = fit.fontSize * 1.12;
          const top = bubble.y - ((fit.lines.length - 1) * lineHeight) / 2 + fit.fontSize * 0.34;
          return (
            <g
              key={bubble.key}
              data-track={model.roles.palette(bubble.track)}
              role="button"
              tabIndex={0}
              aria-label={`${bubble.label}, used in ${bubble.count} project${bubble.count === 1 ? '' : 's'}. Show them`}
              aria-pressed={selected}
              onClick={() => choose(bubble.label)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  choose(bubble.label);
                }
              }}
              onMouseEnter={() => setHover(bubble.key)}
              onMouseLeave={() => setHover(null)}
              style={{ cursor: 'pointer', outline: 'none' }}
            >
              <title>{`${bubble.label}: ${bubble.count} project${bubble.count === 1 ? '' : 's'}`}</title>
              <circle
                cx={bubble.x}
                cy={bubble.y}
                r={bubble.r}
                fill="var(--track-bg)"
                stroke="var(--track-dot)"
                strokeWidth={selected || hover === bubble.key ? 0.9 : 0.45}
              />
              {fit.lines.map((line, i) => (
                <text
                  key={i}
                  x={bubble.x}
                  y={top + i * lineHeight}
                  textAnchor="middle"
                  fontSize={fit.fontSize}
                  fontWeight="600"
                  fill="var(--track-fg)"
                  style={{ pointerEvents: 'none' }}
                >
                  {line}
                </text>
              ))}
              {bubble.count >= 2 && (
                <g aria-hidden="true" style={{ pointerEvents: 'none' }}>
                  <circle
                    cx={bubble.x + bubble.r * 0.72}
                    cy={bubble.y - bubble.r * 0.72}
                    r="1.9"
                    fill="var(--track-dot)"
                    stroke="var(--color-card)"
                    strokeWidth="0.4"
                  />
                  <text
                    x={bubble.x + bubble.r * 0.72}
                    y={bubble.y - bubble.r * 0.72 + 0.65}
                    textAnchor="middle"
                    fontSize="1.9"
                    fontWeight="700"
                    fill="#ffffff"
                  >
                    {bubble.count}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {/* phones: a tag cloud, larger text for technologies used more */}
      <ul
        className="flex flex-wrap gap-2 md:hidden"
        aria-label={`Technology map: ${bubbles.length} technologies`}
      >
        {bubbles.map((bubble) => {
          const selected = isSelected(bubble.label);
          return (
            <li key={bubble.key} data-track={model.roles.palette(bubble.track)}>
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => choose(bubble.label)}
                className={`inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 font-semibold ${
                  bubble.count >= 3
                    ? 'text-base'
                    : bubble.count === 2
                      ? 'text-[0.9375rem]'
                      : 'text-sm'
                }`}
                style={{
                  color: 'var(--track-fg)',
                  backgroundColor: 'var(--track-bg)',
                  borderColor: selected ? 'var(--track-fg)' : 'var(--track-line)',
                  borderWidth: selected ? 2 : 1,
                }}
              >
                {bubble.label}
                {bubble.count >= 2 && (
                  <span
                    className="rounded-full px-1.5 text-xs font-bold text-white"
                    style={{ backgroundColor: 'var(--track-dot)' }}
                  >
                    {bubble.count}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <ul
        className="text-muted mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs"
        aria-label="Colour key"
      >
        {model.roles.list
          .filter((role) => present.has(role.id))
          .map((track) => (
            <li
              key={track.id}
              data-track={model.roles.palette(track.id)}
              className="inline-flex items-center gap-1.5"
            >
              <span className="track-dot" />
              {track.label}
            </li>
          ))}
        {present.has('none') && (
          <li data-track="none" className="inline-flex items-center gap-1.5">
            <span className="track-dot" />
            Other
          </li>
        )}
      </ul>
    </div>
  );
}
