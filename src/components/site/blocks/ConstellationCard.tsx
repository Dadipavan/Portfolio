'use client';

import { usePortfolio } from '../PortfolioProvider';
import Constellation from './Constellation';

// The hero chart: a live map of the technologies used across the projects
export default function ConstellationCard({
  className = '',
  plain = false,
}: {
  className?: string;
  plain?: boolean;
}) {
  const { settings, model, t } = usePortfolio();
  if (!settings.features.heroChart || model.constellation.nodes.length === 0) return null;

  const body = (
    <>
      <div className="mb-3">
        <h2 className="text-ink font-semibold tracking-tight">{t('hero.chartTitle')}</h2>
        <p className="text-muted mt-0.5 text-sm">{t('hero.chartHelp')}</p>
      </div>
      <Constellation />
    </>
  );

  return plain ? (
    <div className={className}>{body}</div>
  ) : (
    <div className={`card p-5 sm:p-6 ${className}`}>{body}</div>
  );
}
