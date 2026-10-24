'use client';

import FactsStrip from '../blocks/FactsStrip';
import KpiTiles from '../blocks/KpiTiles';
import Footer from '../Footer';
import HeroIntro from '../HeroIntro';
import MastheadNav from '../nav/MastheadNav';
import PhotoFrame from '../PhotoFrame';
import { usePortfolio } from '../PortfolioProvider';
import SectionsFlow from '../SectionsFlow';
import RolesBlock from './parts/RolesBlock';

// A magazine front page: a ruled masthead, a huge name headline with the summary as a standfirst, and a portrait
// with a caption in a narrow column beside it. Sections are laid out as two columns (heading left, content right).
export default function EditorialLayout() {
  const { content } = usePortfolio();

  return (
    <>
      <MastheadNav tone="editorial" />
      <main id="main" className="site-main">
        <section
          id="top"
          aria-labelledby="hero-heading"
          className="editorial-hero pt-8 pb-12 sm:pt-12 sm:pb-16"
        >
          <div className="container-page">
            <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
              <div className="editorial-lead lg:col-span-8">
                <HeroIntro large />
              </div>
              <aside className="editorial-side lg:col-span-4" aria-label="Portrait and facts">
                <figure className="editorial-figure mx-auto max-w-xs lg:max-w-none">
                  <PhotoFrame shape="portrait" priority />
                  <figcaption>{content.personalInfo.title}</figcaption>
                </figure>
                <FactsStrip stacked className="mt-6" />
              </aside>
            </div>
            <KpiTiles className="mt-12" />
            <RolesBlock className="mt-10" />
          </div>
        </section>
        <SectionsFlow />
      </main>
      <Footer />
    </>
  );
}
