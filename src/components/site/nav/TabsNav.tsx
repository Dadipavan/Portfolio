'use client';

import { useEffect, useRef } from 'react';
import { useActiveSection, useScrollProgress } from '../hooks';
import { usePortfolio } from '../PortfolioProvider';
import NavTools from './NavTools';

// A bar with the name on the left and every section as a tab (the tabs of a code editor, the stickers of a
// brutalist page, the index tabs of a notebook). The tabs scroll sideways when they do not fit (on a phone they sit
// on a row of their own), and the current tab stays in view. There is no menu button: the tabs are the menu.
// (Only the stylesheet of the look gives it its look.)
export default function TabsNav({ tone = 'terminal' }: { tone?: 'terminal' | 'brutal' | 'notebook' }) {
  const { content, model, scrollToSection } = usePortfolio();
  const listRef = useRef<HTMLUListElement>(null);
  const progressRef = useScrollProgress();
  const active = useActiveSection(model.sections.map((s) => s.id));
  const { shortName } = content.personalInfo;

  // keep the current tab in view when the row is wider than the screen (this moves the row only, never the page)
  useEffect(() => {
    const list = listRef.current;
    const tab = list?.querySelector<HTMLElement>('[aria-current="true"]');
    if (!list || !tab) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    list.scrollTo({
      left: tab.offsetLeft - (list.clientWidth - tab.clientWidth) / 2,
      behavior: reduce ? 'auto' : 'smooth',
    });
  }, [active]);

  const go = (id: string) => (event: React.MouseEvent) => {
    event.preventDefault();
    scrollToSection(id);
  };

  return (
    <header className="tabs-nav sticky top-0 z-40" data-tone={tone}>
      <div className="tabs-bar relative">
        <div className="container-page flex flex-wrap items-center gap-x-4 gap-y-1 py-2 lg:flex-nowrap">
          <a href="#top" className="tabs-brand min-w-0 shrink truncate">
            {shortName}
          </a>
          <NavTools className="tabs-tools ml-auto lg:order-3" menuFrom="never" />
          <nav
            aria-label="Primary"
            className="tabs-strip order-3 w-full min-w-0 lg:order-2 lg:w-auto lg:flex-1"
          >
            <ul
              ref={listRef}
              className="tabs-list flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {model.sections.map((section) => (
                <li key={section.id} className="shrink-0">
                  <a
                    href={`#${section.id}`}
                    onClick={go(section.id)}
                    aria-current={active === section.id ? 'true' : undefined}
                    className="tabs-tab"
                  >
                    {section.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-0.5 overflow-hidden">
          <div
            ref={progressRef}
            className="bg-accent h-full origin-left"
            style={{ transform: 'scaleX(0)' }}
          />
        </div>
      </div>
    </header>
  );
}
