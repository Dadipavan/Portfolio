'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { SectionId } from '@/lib/model';
import { useActiveSection, useScrollProgress, initialsOf } from './hooks';
import NavTools, { MobileNav, navLinkClass } from './nav/NavTools';
import { usePortfolio } from './PortfolioProvider';

interface TopBarProps {
  // bar: full-width strip; floating: a rounded bar that hovers; glass: floating with a glow (dark looks)
  variant?: 'bar' | 'floating' | 'glass';
}

// These sit in the bar itself; the other sections are one tap away under "More"
const INLINE: SectionId[] = ['about', 'insights', 'projects', 'skills', 'experience', 'contact'];

export default function TopBar({ variant = 'bar' }: TopBarProps) {
  const { content, model, scrollToSection, t } = usePortfolio();
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const progressRef = useScrollProgress();
  const active = useActiveSection(model.sections.map((s) => s.id));
  const { shortName } = content.personalInfo;

  const inline = model.sections.filter((s) => INLINE.includes(s.id));
  const more = model.sections.filter((s) => !INLINE.includes(s.id));

  // Escape closes the menus; a click outside closes the "More" list
  useEffect(() => {
    if (!menuOpen && !moreOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (moreOpen) setMoreOpen(false);
        if (menuOpen) {
          setMenuOpen(false);
          toggleRef.current?.focus();
        }
      }
    };
    const onPointer = (event: MouseEvent) => {
      if (moreOpen && moreRef.current && !moreRef.current.contains(event.target as Node))
        setMoreOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onPointer);
    };
  }, [menuOpen, moreOpen]);

  const linkClass = (id: string) => navLinkClass(active === id);

  const go = (id: string) => (event: React.MouseEvent) => {
    event.preventDefault();
    setMenuOpen(false);
    setMoreOpen(false);
    scrollToSection(id);
  };

  const shell =
    variant === 'bar'
      ? 'border-b border-line bg-page/85 backdrop-blur-md'
      : variant === 'glass'
        ? 'rounded-2xl border border-line-strong bg-card/70 shadow-lift backdrop-blur-xl'
        : 'rounded-2xl border border-line bg-card/85 shadow-card backdrop-blur-md';
  const outer = variant === 'bar' ? 'sticky top-0 z-40' : 'sticky top-2 z-40 px-2 sm:top-3 sm:px-5';
  const inner = variant === 'bar' ? '' : 'mx-auto max-w-6xl';
  const moreActive = more.some((s) => s.id === active);

  return (
    <header className={`top-bar ${outer}`}>
      <div className={`${inner} top-bar-shell relative ${shell}`}>
        <div
          className={`${variant === 'bar' ? 'container-page' : 'px-3 sm:px-5'} flex h-14 items-center justify-between gap-2 sm:h-16 sm:gap-4`}
        >
          <a
            href="#top"
            className="top-bar-brand text-ink flex min-w-0 shrink items-center gap-2.5 text-base font-semibold tracking-tight whitespace-nowrap"
          >
            <span
              aria-hidden="true"
              className="top-bar-logo bg-accent flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
            >
              {initialsOf(shortName)}
            </span>
            <span className="max-w-[7.5rem] truncate sm:max-w-[13rem]">{shortName}</span>
          </a>

          <nav aria-label="Primary" className="hidden shrink-0 items-center xl:flex">
            {inline.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                aria-current={active === section.id ? 'true' : undefined}
                className={linkClass(section.id)}
                onClick={go(section.id)}
              >
                {section.label}
              </a>
            ))}
            {more.length > 0 && (
              <div ref={moreRef} className="relative">
                <button
                  type="button"
                  aria-expanded={moreOpen}
                  aria-haspopup="true"
                  onClick={() => setMoreOpen((value) => !value)}
                  className={`${linkClass(moreActive ? active : '')} inline-flex items-center gap-1`}
                >
                  {t('nav.more')}
                  <ChevronDown
                    aria-hidden="true"
                    className={`h-4 w-4 transition-transform ${moreOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {moreOpen && (
                  <ul className="animate-fade-in border-line bg-card shadow-lift absolute top-full right-0 z-50 mt-2 w-52 rounded-xl border p-1.5">
                    {more.map((section) => (
                      <li key={section.id}>
                        <a
                          href={`#${section.id}`}
                          onClick={go(section.id)}
                          aria-current={active === section.id ? 'true' : undefined}
                          className={`block rounded-lg px-3 py-2 text-sm font-medium ${
                            active === section.id
                              ? 'bg-accent-soft text-accent-soft-ink'
                              : 'text-body hover:bg-surface hover:text-ink'
                          }`}
                        >
                          {section.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </nav>

          <NavTools
            menuOpen={menuOpen}
            onToggleMenu={() => setMenuOpen((value) => !value)}
            menuButtonRef={toggleRef}
          />
        </div>

        <MobileNav open={menuOpen} active={active} onGo={go} onClose={() => setMenuOpen(false)} />

        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-0.5 overflow-hidden rounded-b-2xl"
        >
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
