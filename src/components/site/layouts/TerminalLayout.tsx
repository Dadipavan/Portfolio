'use client';

import FactsStrip from '../blocks/FactsStrip';
import KpiTiles from '../blocks/KpiTiles';
import Footer from '../Footer';
import HeroIntro from '../HeroIntro';
import TabsNav from '../nav/TabsNav';
import { usePortfolio } from '../PortfolioProvider';
import SectionsFlow from '../SectionsFlow';
import RolesBlock from './parts/RolesBlock';

const slug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

// A developer's command line: editor-style tabs for the menu, the introduction inside a terminal window, and every
// section as a window of its own (the stylesheet draws the title bars). No photo layout.
export default function TerminalLayout() {
  const { content } = usePortfolio();

  return (
    <>
      <TabsNav tone="terminal" />
      <main id="main" className="site-main">
        <section
          id="top"
          aria-labelledby="hero-heading"
          className="terminal-hero pt-8 pb-12 sm:pt-12 sm:pb-16"
        >
          <div className="container-page">
            <div className="term-window">
              <div className="term-titlebar" aria-hidden="true">
                <span className="term-dots">
                  <i />
                  <i />
                  <i />
                </span>
                <span className="term-title">~/portfolio/{slug(content.personalInfo.shortName)}</span>
              </div>
              <div className="term-body">
                <HeroIntro />
              </div>
            </div>
            <KpiTiles className="mt-8" />
            <RolesBlock className="mt-8" />
            <FactsStrip className="mt-8" />
          </div>
        </section>
        <SectionsFlow />
      </main>
      <Footer />
    </>
  );
}
