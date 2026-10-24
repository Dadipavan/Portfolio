'use client';

import Footer from '../Footer';
import HeroBody from '../blocks/HeroBody';
import SectionsFlow from '../SectionsFlow';
import TopBar from '../TopBar';

// Dark glass cards over a glowing data backdrop, with the intro as the centrepiece.
export default function LabLayout() {
  return (
    <>
      <div aria-hidden="true" className="lab-backdrop" />
      <TopBar variant="glass" />
      <main id="main" className="site-main">
        <section
          id="top"
          aria-labelledby="hero-heading"
          className="relative overflow-hidden pt-10 pb-14 sm:pt-20 sm:pb-16"
        >
          <div className="container-page relative">
            <HeroBody side={false} align="center" large gradient />
          </div>
        </section>
        <SectionsFlow />
      </main>
      <Footer />
    </>
  );
}
