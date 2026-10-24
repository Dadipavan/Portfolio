'use client';

import FactsStrip from '../blocks/FactsStrip';
import KpiTiles from '../blocks/KpiTiles';
import Footer from '../Footer';
import HeroIntro from '../HeroIntro';
import PhotoFrame from '../PhotoFrame';
import SectionsFlow from '../SectionsFlow';
import TopBar from '../TopBar';
import RolesBlock from './parts/RolesBlock';

// Warm and personal: a large arch-shaped portrait beside the name (above it on a phone), soft colours and a
// gentle serif. Without a photo the arch shows the initials.
export default function PortraitLayout() {
  return (
    <>
      <TopBar variant="bar" />
      <main id="main" className="site-main">
        <section
          id="top"
          aria-labelledby="hero-heading"
          className="portrait-hero relative overflow-hidden pt-8 pb-12 sm:pt-14 sm:pb-16"
        >
          <div className="container-page relative">
            <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-16">
              <div className="portrait-photo order-1 mx-auto w-full max-w-[16rem] sm:max-w-xs lg:order-2 lg:max-w-md">
                <PhotoFrame shape="arch" priority />
              </div>
              <div className="order-2 lg:order-1">
                <HeroIntro />
              </div>
            </div>
            <KpiTiles className="mt-12 sm:mt-16" />
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
