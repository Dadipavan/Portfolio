'use client';

import FactsStrip from '../blocks/FactsStrip';
import KpiTiles from '../blocks/KpiTiles';
import Footer from '../Footer';
import HeroIntro from '../HeroIntro';
import MastheadNav from '../nav/MastheadNav';
import PhotoFrame from '../PhotoFrame';
import SectionsFlow from '../SectionsFlow';
import RolesBlock from './parts/RolesBlock';

// A traditional CV online: one centred, narrow column. A small round photo (initials without one), the name, the
// summary and the profile links in the middle, then the numbers, roles and facts as quiet lines.
export default function ClassicLayout() {
  return (
    <>
      <MastheadNav tone="classic" />
      <main id="main" className="site-main">
        <section
          id="top"
          aria-labelledby="hero-heading"
          className="classic-hero pt-10 pb-12 sm:pt-14 sm:pb-16"
        >
          <div className="container-page classic-column">
            <PhotoFrame shape="circle" className="classic-photo mx-auto mb-8" priority />
            <HeroIntro align="center" />
            <KpiTiles className="mt-12" />
            <RolesBlock className="mt-12" headingClassName="text-center" />
            <FactsStrip className="mt-10" />
          </div>
        </section>
        <SectionsFlow />
      </main>
      <Footer />
    </>
  );
}
