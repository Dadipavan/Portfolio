'use client';

import ConstellationCard from '../blocks/ConstellationCard';
import FactsStrip from '../blocks/FactsStrip';
import FeaturedTile from '../blocks/FeaturedTile';
import KpiTiles from '../blocks/KpiTiles';
import RolePipeline from '../blocks/RolePipeline';
import Footer from '../Footer';
import HeroIntro from '../HeroIntro';
import SectionsFlow from '../SectionsFlow';
import TopBar from '../TopBar';
import { usePortfolio } from '../PortfolioProvider';

// A grid of tiles: intro, technology map, key numbers, role pipeline and a featured project.
export default function BentoLayout() {
  const { settings, model, t } = usePortfolio();
  const chart = settings.features.heroChart && model.constellation.nodes.length > 0;

  return (
    <>
      <TopBar variant="floating" />
      <main id="main" className="site-main">
        <section
          id="top"
          aria-labelledby="hero-heading"
          className="relative overflow-hidden pt-6 pb-14 sm:pt-10 sm:pb-16"
        >
          <div className="container-page relative">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              <div
                className={`card relative order-1 overflow-hidden p-5 sm:p-10 lg:order-none ${chart ? 'lg:col-span-7' : 'lg:col-span-12'}`}
                style={{
                  backgroundImage:
                    'linear-gradient(135deg, var(--color-accent-soft), var(--color-card) 65%)',
                }}
              >
                <HeroIntro />
              </div>
              {chart && (
                <div className="order-3 lg:order-none lg:col-span-5">
                  <ConstellationCard className="h-full" />
                </div>
              )}
              <KpiTiles className="order-2 lg:order-none lg:col-span-12" />
              <div className="order-4 lg:order-none lg:col-span-12">
                {model.roleStats.length > 0 && (
                  <h2 className="mono-label mt-2 mb-3">{t('hero.rolesHeading')}</h2>
                )}
                <RolePipeline />
              </div>
              <FeaturedTile className="order-5 lg:order-none lg:col-span-7" />
              <FactsStrip stacked className="order-6 lg:order-none lg:col-span-5 lg:self-stretch" />
            </div>
          </div>
        </section>
        <SectionsFlow />
      </main>
      <Footer />
    </>
  );
}
