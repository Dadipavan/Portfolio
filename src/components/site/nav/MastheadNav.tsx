'use client';

import { useEffect, useRef, useState } from 'react';
import { useActiveSection, useScrollProgress } from '../hooks';
import { usePortfolio } from '../PortfolioProvider';
import NavTools, { MobileNav } from './NavTools';

interface MastheadNavProps {
  // which look it belongs to (the stylesheet of the look decides what the masthead looks like)
  tone: 'editorial' | 'classic';
}

// The head of the editorial and classic looks, like the front of a magazine or the top of a printed CV: the name in
// the middle with a line about the person and the tools beside it, and the section links in a row underneath.
// From large screens the masthead scrolls away and only the row of links stays in view; on smaller screens the header
// stays and the sections are in the menu. (Only the stylesheets of the looks give it its look.)
export default function MastheadNav({ tone }: MastheadNavProps) {
  const { content, model, scrollToSection } = usePortfolio();
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const barProgress = useScrollProgress();
  const stripProgress = useScrollProgress();
  const active = useActiveSection(model.sections.map((s) => s.id));
  const { shortName, title } = content.personalInfo;

  // Escape closes the menu and puts focus back on its button
  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  const go = (id: string) => (event: React.MouseEvent) => {
    event.preventDefault();
    setMenuOpen(false);
    scrollToSection(id);
  };

  return (
    <>
      <header className="masthead sticky top-0 z-40 lg:static" data-tone={tone}>
        <div className="masthead-inner relative">
          <div className="container-page masthead-row flex h-14 items-center justify-between gap-3 lg:grid lg:h-auto lg:grid-cols-[1fr_auto_1fr] lg:py-6">
            <p className="masthead-side hidden lg:block">{title}</p>
            <a href="#top" className="masthead-brand min-w-0 truncate">
              {shortName}
            </a>
            <NavTools
              className="masthead-tools lg:justify-self-end"
              menuOpen={menuOpen}
              onToggleMenu={() => setMenuOpen((value) => !value)}
              menuButtonRef={toggleRef}
              menuFrom="lg"
            />
          </div>
          <MobileNav open={menuOpen} from="lg" active={active} onGo={go} onClose={() => setMenuOpen(false)} />
          <div
            aria-hidden="true"
            className="masthead-progress absolute inset-x-0 bottom-0 h-0.5 overflow-hidden lg:hidden"
          >
            <div
              ref={barProgress}
              className="bg-accent h-full origin-left"
              style={{ transform: 'scaleX(0)' }}
            />
          </div>
        </div>
      </header>

      <nav aria-label="Primary" className="masthead-links sticky top-0 z-30 hidden lg:block" data-tone={tone}>
        <ul className="container-page masthead-links-list flex flex-wrap items-center justify-center gap-x-1 gap-y-0.5">
          {model.sections.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                onClick={go(section.id)}
                aria-current={active === section.id ? 'true' : undefined}
                className="masthead-link"
              >
                {section.label}
              </a>
            </li>
          ))}
        </ul>
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-0.5 overflow-hidden">
          <div
            ref={stripProgress}
            className="bg-accent h-full origin-left"
            style={{ transform: 'scaleX(0)' }}
          />
        </div>
      </nav>
    </>
  );
}
