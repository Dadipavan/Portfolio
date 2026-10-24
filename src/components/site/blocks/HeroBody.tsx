'use client';

import { usePortfolio } from '../PortfolioProvider';
import HeroIntro from '../HeroIntro';
import ConstellationCard from './ConstellationCard';
import FactsStrip from './FactsStrip';
import KpiTiles from './KpiTiles';
import RolePipeline from './RolePipeline';

interface HeroBodyProps {
  // true: the chart sits beside the intro on large screens; false: it sits below
  side?: boolean;
  align?: 'left' | 'center';
  large?: boolean;
  gradient?: boolean;
  roleSwitchClassName?: string;
}

// Everything at the top of a look. On a phone the order is: intro, key numbers, chart, roles, facts, so
// the first screens are quick to read; on large screens the chart sits beside the intro.
export default function HeroBody({
  side = true,
  align = 'left',
  large = false,
  gradient = false,
  roleSwitchClassName,
}: HeroBodyProps) {
  const { settings, model, t } = usePortfolio();
  const chart = settings.features.heroChart && model.constellation.nodes.length > 0;
  const center = align === 'center';

  return (
    <div
      className={`grid grid-cols-1 gap-x-10 gap-y-8 ${side && chart ? 'lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center' : ''}`}
    >
      <div className="order-1 lg:order-none">
        <HeroIntro
          align={align}
          large={large}
          gradient={gradient}
          roleSwitchClassName={roleSwitchClassName}
        />
      </div>
      {chart && (
        <div
          className={`order-3 lg:order-none ${side ? '' : 'mx-auto w-full max-w-4xl'} animate-fade-up [animation-delay:150ms]`}
        >
          <ConstellationCard />
        </div>
      )}
      <KpiTiles className={`order-2 lg:order-none ${side && chart ? 'lg:col-span-2' : ''}`} />
      <div className={`order-4 lg:order-none ${side && chart ? 'lg:col-span-2' : ''}`}>
        {model.roleStats.length > 0 && (
          <h2 className={`mono-label mb-3 ${center ? 'text-center' : ''}`}>
            {t('hero.rolesHeading')}
          </h2>
        )}
        <RolePipeline />
      </div>
      <FactsStrip className={`order-5 lg:order-none ${side && chart ? 'lg:col-span-2' : ''}`} />
    </div>
  );
}
