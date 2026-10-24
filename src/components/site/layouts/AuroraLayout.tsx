'use client';

import FactsStrip from '../blocks/FactsStrip';
import KpiTiles from '../blocks/KpiTiles';
import Footer from '../Footer';
import HeroIntro from '../HeroIntro';
import DockNav from '../nav/DockNav';
import NavTools from '../nav/NavTools';
import PhotoFrame from '../PhotoFrame';
import { usePortfolio } from '../PortfolioProvider';
import SectionsFlow from '../SectionsFlow';
import RolesBlock from './parts/RolesBlock';

// Soft light and frosted glass: a slim header, a centred introduction over drifting colour, every section as a
// floating panel, and a dock at the bottom of the screen as the menu (the same on a phone and on a big screen).
export default function AuroraLayout() {
  const { content } = usePortfolio();

  return (
    <>
      <div aria-hidden="true" className="aurora-backdrop" />
      <header className="aurora-header">
        <div className="container-page flex h-14 items-center justify-between gap-3 sm:h-16">
          <a href="#top" className="aurora-brand min-w-0 truncate">
            {content.personalInfo.shortName}
          </a>
          <NavTools menuFrom="never" />
        </div>
      </header>
      <main id="main" className="site-main">
        <section
          id="top"
          aria-labelledby="hero-heading"
          className="aurora-hero pt-6 pb-10 sm:pt-12 sm:pb-14"
        >
          <div className="container-page text-center">
            <PhotoFrame shape="circle" className="aurora-photo mx-auto mb-8" priority />
            <HeroIntro align="center" large gradient />
            <KpiTiles className="mt-12" />
            <RolesBlock className="mt-10" headingClassName="text-center" />
            <FactsStrip className="mt-8 text-left" />
          </div>
        </section>
        <SectionsFlow />
      </main>
      <Footer />
      {/* room at the end of the page so the dock never covers the last lines */}
      <div aria-hidden="true" className="h-24" />
      <DockNav />
    </>
  );
}
