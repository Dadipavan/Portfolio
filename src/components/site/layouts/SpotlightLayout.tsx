'use client';

import FactsStrip from '../blocks/FactsStrip';
import KpiTiles from '../blocks/KpiTiles';
import Footer from '../Footer';
import HeroIntro from '../HeroIntro';
import DotNav from '../nav/DotNav';
import PhotoFrame from '../PhotoFrame';
import SectionsFlow from '../SectionsFlow';
import TopBar from '../TopBar';
import RolesBlock from './parts/RolesBlock';

// A dark stage: a huge name, a glowing spotlight behind a round photo (initials without one), very large numbers,
// and a column of dots down the right edge of big screens.
export default function SpotlightLayout() {
  return (
    <>
      <TopBar variant="bar" />
      <DotNav />
      <main id="main" className="site-main">
        <section
          id="top"
          aria-labelledby="hero-heading"
          className="spotlight-hero relative overflow-hidden pt-10 pb-14 sm:pt-16 sm:pb-20"
        >
          <div aria-hidden="true" className="spotlight-cone" />
          <div className="container-page relative">
            <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)] lg:gap-14">
              <div className="order-2 lg:order-1">
                <HeroIntro large />
              </div>
              <div className="spotlight-photo order-1 mx-auto w-full max-w-[14rem] sm:max-w-[17rem] lg:order-2 lg:max-w-sm">
                <PhotoFrame shape="circle" priority />
              </div>
            </div>
            <KpiTiles className="mt-14 sm:mt-20" />
            <RolesBlock className="mt-12" />
            <FactsStrip className="mt-8" />
          </div>
        </section>
        <SectionsFlow />
      </main>
      <Footer />
    </>
  );
}
