'use client';

import FactsStrip from '../blocks/FactsStrip';
import KpiTiles from '../blocks/KpiTiles';
import Footer from '../Footer';
import HeroIntro from '../HeroIntro';
import TabsNav from '../nav/TabsNav';
import PhotoFrame from '../PhotoFrame';
import SectionsFlow from '../SectionsFlow';
import RolesBlock from './parts/RolesBlock';

// A paper notebook on a desk: the introduction on a ruled page, the photo as a taped polaroid, the numbers as
// sticky notes, and index-card tabs for the menu.
export default function NotebookLayout() {
  return (
    <>
      <TabsNav tone="notebook" />
      <main id="main" className="site-main">
        <section
          id="top"
          aria-labelledby="hero-heading"
          className="notebook-hero pt-8 pb-12 sm:pt-12 sm:pb-16"
        >
          <div className="container-page">
            <div className="notebook-page grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-12">
              <div className="notebook-text order-2 lg:order-1">
                <HeroIntro />
              </div>
              <div className="notebook-photo order-1 mx-auto w-full max-w-[13rem] lg:order-2 lg:max-w-none">
                <PhotoFrame shape="polaroid" priority />
              </div>
            </div>
            <KpiTiles className="mt-10" />
            <RolesBlock className="mt-10" />
            <FactsStrip className="mt-8" />
          </div>
        </section>
        <SectionsFlow />
      </main>
      <Footer />
    </>
  );
}
