'use client';

import type { WidgetId } from '@/lib/types';
import Section from '../Section';
import { usePortfolio } from '../PortfolioProvider';
import ChartCard from './ChartCard';
import RadarChart from './RadarChart';
import YearChart from './YearChart';
import TechMap from './TechMap';
import Heatmap from './Heatmap';
import DataMenu from '../DataMenu';

const SPAN: Partial<Record<WidgetId, string>> = {
  techMap: 'lg:col-span-2',
  heatmap: 'lg:col-span-2',
};

// Charts built from the same data as the rest of the page. The admin chooses which ones show and in what order.
export default function Insights({ number }: { number: string }) {
  const { settings, model, t } = usePortfolio();
  const widgets = settings.appearance.widgets.filter((w) => w !== 'kpis');

  const render = (widget: WidgetId) => {
    switch (widget) {
      case 'radar':
        return (
          <ChartCard title={t('chart.radar.title')} description={t('chart.radar.help')}>
            <RadarChart />
          </ChartCard>
        );
      case 'perYear':
        return (
          <ChartCard title={t('chart.year.title')} description={t('chart.year.help')}>
            <YearChart />
          </ChartCard>
        );
      case 'techMap':
        return (
          <ChartCard title={t('chart.techmap.title')} description={t('chart.techmap.help')}>
            <TechMap />
          </ChartCard>
        );
      case 'heatmap':
        return (
          <ChartCard title={t('chart.heatmap.title')} description={t('chart.heatmap.help')}>
            <Heatmap />
          </ChartCard>
        );
      default:
        return null;
    }
  };

  return (
    <Section id="insights" number={number}>
      <div className="grid grid-flow-dense grid-cols-1 gap-6 lg:grid-cols-2">
        {widgets.map((widget) => (
          <div key={widget} className={`${SPAN[widget] ?? ''} min-w-0`}>
            {render(widget)}
          </div>
        ))}
      </div>
      {settings.features.dataDownloads && model.techMap.bubbles.length > 0 && (
        <div className="text-muted mt-6 flex flex-wrap items-center gap-3 text-sm">
          <span>{t('insights.download')}</span>
          <DataMenu />
        </div>
      )}
    </Section>
  );
}
