'use client';

import FactsStrip from '../blocks/FactsStrip';
import KpiTiles from '../blocks/KpiTiles';
import Footer from '../Footer';
import HeroIntro from '../HeroIntro';
import TabsNav from '../nav/TabsNav';
import PhotoFrame from '../PhotoFrame';
import SectionsFlow from '../SectionsFlow';
import RolesBlock from './parts/RolesBlock';

// Thick outlines and hard shadows: the introduction in a bordered block, the photo like a sticker beside it,
// and chunky coloured number boxes.
export default function BrutalLayout() {
  return (
    <>
      <TabsNav tone="brutal" />
      <main id="main" className="site-main">
        <section
          id="top"
          aria-labelledby="hero-heading"
          className="brutal-hero pt-8 pb-12 sm:pt-12 sm:pb-16"
        >
          <div className="container-page">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)] lg:items-start lg:gap-10">
              <div className="brutal-block order-2 lg:order-1">
                <HeroIntro large />
              </div>
              <div className="order-1 space-y-6 lg:order-2">
                <PhotoFrame
                  shape="square"
                  className="brutal-photo mx-auto max-w-[15rem] lg:max-w-none"
                  priority
                />
                <FactsStrip stacked />
              </div>
            </div>
            <KpiTiles className="mt-10 sm:mt-14" />
            <RolesBlock className="mt-10" />
          </div>
        </section>
        <SectionsFlow />
      </main>
      <Footer />
    </>
  );
}
