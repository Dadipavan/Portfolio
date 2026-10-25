'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Images,
  Award,
  Briefcase,
  Clock,
  FolderKanban,
  GraduationCap,
  Handshake,
  LayoutGrid,
  Mail,
  Quote,
  Trophy,
  User,
  Wrench,
  ChartColumn,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { SectionId } from '@/lib/model';
import { useActiveSection } from '../hooks';
import { usePortfolio } from '../PortfolioProvider';
import { MobileNav } from './NavTools';

const ICONS: Record<SectionId, LucideIcon> = {
  about: User,
  insights: ChartColumn,
  projects: FolderKanban,
  skills: Wrench,
  timeline: Clock,
  experience: Briefcase,
  education: GraduationCap,
  certifications: Award,
  achievements: Trophy,
  moments: Images,
  recommendations: Quote,
  work: Handshake,
  contact: Mail,
};

// These sit on the dock itself; every other section is under "Menu"
const ON_DOCK: SectionId[] = ['about', 'projects', 'skills', 'experience', 'contact'];

// A floating dock at the bottom of the screen, like the bar of a phone app: the main sections as icons with a
// "Menu" button that opens the full list (with the role switch, summary, share and resume).
// The page needs some space at its end (the layout adds it) so the dock never covers the last lines.
export default function DockNav({ tone = 'aurora' }: { tone?: 'aurora' }) {
  const { model, scrollToSection, t } = usePortfolio();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const active = useActiveSection(model.sections.map((s) => s.id));
  const docked = ON_DOCK.map((id) => model.sections.find((s) => s.id === id)).filter(
    (section): section is NonNullable<typeof section> => Boolean(section)
  );
  const moreActive = Boolean(active) && !docked.some((section) => section.id === active);

  // Escape closes the list (and returns to the button); so does a tap outside the dock
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onPointer = (event: MouseEvent | TouchEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('touchstart', onPointer);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('touchstart', onPointer);
    };
  }, [open]);

  const go = (id: string) => (event: React.MouseEvent) => {
    event.preventDefault();
    setOpen(false);
    scrollToSection(id);
  };

  return (
    <div
      ref={wrapRef}
      data-tone={tone}
      className="dock-wrap pointer-events-none fixed inset-x-0 bottom-0 z-40 flex flex-col items-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    >
      <div className="dock-sheet pointer-events-auto mb-2 w-full max-w-md" hidden={!open}>
        <MobileNav
          open={open}
          from="always"
          active={active}
          onGo={go}
          onClose={() => setOpen(false)}
          className="dock-sheet-nav"
        />
      </div>
      <nav aria-label="Primary" className="dock pointer-events-auto">
        <ul className="dock-list flex items-center gap-1">
          {docked.map((section) => {
            const Icon = ICONS[section.id];
            return (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  onClick={go(section.id)}
                  aria-current={active === section.id ? 'true' : undefined}
                  className="dock-item"
                >
                  <Icon aria-hidden="true" className="dock-icon h-5 w-5" />
                  <span className="dock-label">{section.label}</span>
                </a>
              </li>
            );
          })}
          <li>
            <button
              ref={buttonRef}
              type="button"
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-current={moreActive ? 'true' : undefined}
              onClick={() => setOpen((value) => !value)}
              className="dock-item dock-menu"
            >
              <LayoutGrid aria-hidden="true" className="dock-icon h-5 w-5" />
              <span className="dock-label">{t('nav.more')}</span>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
