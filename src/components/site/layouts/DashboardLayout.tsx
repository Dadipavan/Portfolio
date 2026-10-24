'use client';

import Footer from '../Footer';
import HeroBody from '../blocks/HeroBody';
import SectionsFlow from '../SectionsFlow';
import TopBar from '../TopBar';

// Analytics-style: the intro and a live technology chart up front, then number tiles and the role pipeline.
export default function DashboardLayout() {
  return (
    <>
      <TopBar variant="bar" />
      <main id="main" className="site-main">
        <section
          id="top"
          aria-labelledby="hero-heading"
          className="relative overflow-hidden pt-8 pb-14 sm:pt-16 sm:pb-16"
        >
          <div
            aria-hidden="true"
            className="bg-dots pointer-events-none absolute inset-x-0 top-0 h-[34rem]"
          />
          <div className="container-page relative">
            <HeroBody side />
          </div>
        </section>
        <SectionsFlow />
      </main>
      <Footer />
    </>
  );
}
