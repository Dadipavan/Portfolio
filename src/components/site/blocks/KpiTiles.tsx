'use client';

import CountUp from '../CountUp';
import { usePortfolio } from '../PortfolioProvider';
import { DATA_STYLE_FEATURES } from '@/lib/siteSettings';

// The highlights strip: the numbers chosen in the admin, or counts worked out from the content
export default function KpiTiles({ className = '' }: { className?: string }) {
  const { model, settings } = usePortfolio();
  if (!settings.appearance.widgets.includes('kpis') || model.kpis.length === 0) return null;

  const animate = settings.features.countUp && settings.appearance.animations;
  const dataStyle = DATA_STYLE_FEATURES.some((id) => settings.features[id]);

  return (
    <dl className={`kpi-tiles grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 ${className}`}>
      {model.kpis.map((kpi) => (
        <div key={kpi.label} className="kpi-tile tile relative overflow-hidden">
          <span aria-hidden="true" className="kpi-bar bg-accent absolute inset-x-0 top-0 h-0.5" />
          <dd
            className={`kpi-value text-ink text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl md:text-3xl lg:text-4xl ${dataStyle ? 'font-mono' : ''}`}
          >
            <CountUp value={kpi.value} animate={animate} />
          </dd>
          <dt className={`kpi-label ${dataStyle ? 'mono-label mt-1' : 'text-muted mt-1 text-sm'}`}>
            {kpi.label}
          </dt>
        </div>
      ))}
    </dl>
  );
}
