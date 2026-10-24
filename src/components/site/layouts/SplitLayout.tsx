'use client';

import Footer from '../Footer';
import HeroBody from '../blocks/HeroBody';
import SectionsFlow from '../SectionsFlow';
import Sidebar from '../Sidebar';
import TopBar from '../TopBar';

// The profile and menu stay fixed on the left (large screens) while the content scrolls beside it.
// On smaller screens the sidebar becomes the normal top bar.
export default function SplitLayout() {
  return (
    <div className="xl:grid xl:grid-cols-[19rem_minmax(0,1fr)]">
      <div className="xl:sticky xl:top-0 xl:self-start">
        <Sidebar />
      </div>
      <div className="min-w-0">
        <div className="xl:hidden">
          <TopBar variant="bar" />
        </div>
        <main id="main" className="site-main">
          <section
            id="top"
            aria-labelledby="hero-heading"
            className="relative overflow-hidden pt-8 pb-12 sm:pt-14 sm:pb-14"
          >
            <div
              aria-hidden="true"
              className="bg-dots pointer-events-none absolute inset-x-0 top-0 h-[30rem]"
            />
            <div className="container-page relative">
              <HeroBody side={false} roleSwitchClassName="xl:hidden" />
            </div>
          </section>
          <SectionsFlow />
        </main>
        <Footer />
      </div>
    </div>
  );
}
