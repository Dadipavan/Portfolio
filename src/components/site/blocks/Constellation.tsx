'use client';

import { useMemo, useState } from 'react';
import type { ConstellationData } from '@/lib/charts';
import { usePortfolio } from '../PortfolioProvider';

interface PictureProps {
  data: ConstellationData;
  hover: string | null;
  setHover: (key: string | null) => void;
  neighbours: Map<string, Set<string>>;
  className: string;
}

// One drawing of the constellation (the page holds a wide one and a tall one and shows the one that fits)
function Picture({ data, hover, setHover, neighbours, className }: PictureProps) {
  const { model, role, openTag } = usePortfolio();
  const nodeByKey = useMemo(() => new Map(data.nodes.map((n) => [n.key, n])), [data.nodes]);
  const k = data.scale;

  const isDimmed = (key: string, track: string) => {
    if (hover) return key !== hover && !neighbours.get(hover)?.has(key);
    return role !== 'all' && track !== role;
  };

  return (
    <svg
      viewBox={`0 0 ${data.width} ${data.height}`}
      role="group"
      aria-label={`Technology constellation: ${data.nodes.length} technologies. Select one to see where it is used.`}
      className={`h-auto w-full overflow-visible ${className}`}
    >
      <g aria-hidden="true">
        {data.edges.map((edge) => {
          const a = nodeByKey.get(edge.a)!;
          const b = nodeByKey.get(edge.b)!;
          const lit = hover !== null && (edge.a === hover || edge.b === hover);
          return (
            <line
              key={`${edge.a}-${edge.b}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={lit ? 'var(--color-accent-ink)' : 'var(--color-line-strong)'}
              strokeWidth={(lit ? 0.45 : 0.22 + edge.weight * 0.08) * k}
              opacity={hover ? (lit ? 0.9 : 0.12) : 0.7}
            />
          );
        })}
      </g>

      {data.nodes.map((node, index) => {
        const dimmed = isDimmed(node.key, node.track);
        return (
          <g
            key={node.key}
            data-track={model.roles.palette(node.track)}
            transform={`translate(${node.x} ${node.y})`}
            opacity={dimmed ? 0.22 : 1}
            style={{ transition: 'opacity 0.2s' }}
          >
            <g className="node-drift" style={{ ['--delay' as string]: `${(index * 0.37) % 5}s` }}>
              <g
                role="button"
                tabIndex={0}
                aria-label={`${node.label}, used in ${node.count} project${node.count === 1 ? '' : 's'}. Show where it is used`}
                onClick={() => openTag(node.label)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openTag(node.label);
                  }
                }}
                onMouseEnter={() => setHover(node.key)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(node.key)}
                onBlur={() => setHover(null)}
                style={{ cursor: 'pointer', outline: 'none' }}
              >
                <title>{`${node.label}: ${node.count} project${node.count === 1 ? '' : 's'}`}</title>
                <circle r={node.r + 1.4 * k} fill="transparent" />
                <circle
                  r={node.r}
                  fill="var(--track-bg)"
                  stroke="var(--track-dot)"
                  strokeWidth={(hover === node.key ? 0.9 : 0.5) * k}
                />
                <circle r={Math.max(0.9 * k, node.r * 0.32)} fill="var(--track-dot)" />
                {(node.labelAt || hover === node.key) && (
                  <text
                    x={(node.labelAt ? node.labelAt.x : node.x) - node.x}
                    y={(node.labelAt ? node.labelAt.y : node.y + node.r + 3.2 * k) - node.y}
                    textAnchor={node.labelAt?.anchor ?? 'middle'}
                    fontSize={data.fontSize}
                    fontWeight="600"
                    fill="var(--color-ink)"
                    stroke="var(--color-card)"
                    strokeWidth={0.9 * k}
                    paintOrder="stroke"
                    style={{ pointerEvents: 'none' }}
                  >
                    {node.labelAt?.text ?? node.label}
                  </text>
                )}
              </g>
            </g>
          </g>
        );
      })}
    </svg>
  );
}

// Every technology used in the projects as a dot: bigger = used in more projects, lines = used together,
// colour = the role it belongs to. Select a dot to see where it shows up.
// Phones get a taller picture with larger names, so nothing needs to scroll sideways.
export default function Constellation({ className = '' }: { className?: string }) {
  const { model } = usePortfolio();
  const data = model.constellation;
  const [hover, setHover] = useState<string | null>(null);

  const neighbours = useMemo(() => {
    const map = new Map<string, Set<string>>();
    data.edges.forEach((e) => {
      map.set(e.a, (map.get(e.a) ?? new Set()).add(e.b));
      map.set(e.b, (map.get(e.b) ?? new Set()).add(e.a));
    });
    return map;
  }, [data.edges]);

  const presentTracks = useMemo(() => new Set(data.nodes.map((n) => n.track)), [data.nodes]);
  const presentOnPhone = useMemo(
    () => new Set(model.constellationCompact.nodes.map((n) => n.track)),
    [model.constellationCompact.nodes]
  );

  if (data.nodes.length === 0) return null;

  return (
    <div className={className}>
      <Picture
        data={data}
        hover={hover}
        setHover={setHover}
        neighbours={neighbours}
        className="hidden sm:block"
      />
      <Picture
        data={model.constellationCompact}
        hover={hover}
        setHover={setHover}
        neighbours={neighbours}
        className="sm:hidden"
      />

      <ul
        className="text-muted mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs"
        aria-label="Colour key"
      >
        {model.roles.list
          .filter((role) => presentTracks.has(role.id) || presentOnPhone.has(role.id))
          .map((role) => (
            <li
              key={role.id}
              data-track={model.roles.palette(role.id)}
              className="inline-flex items-center gap-1.5"
            >
              <span className="track-dot" />
              {role.label}
            </li>
          ))}
        {presentTracks.has('none') && (
          <li data-track="none" className="inline-flex items-center gap-1.5">
            <span className="track-dot" />
            Other
          </li>
        )}
      </ul>
    </div>
  );
}
