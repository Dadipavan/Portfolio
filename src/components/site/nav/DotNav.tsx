'use client';

import { useActiveSection } from '../hooks';
import { usePortfolio } from '../PortfolioProvider';

// A column of dots down the right edge of large screens, one for each section: the current one is filled, and the
// name of a section appears beside its dot on hover or keyboard focus. (Only the stylesheet gives it its look.)
export default function DotNav({ tone = 'spotlight' }: { tone?: 'spotlight' }) {
  const { model, scrollToSection } = usePortfolio();
  const active = useActiveSection(model.sections.map((s) => s.id));

  return (
    <nav
      aria-label="Page sections"
      data-tone={tone}
      className="dot-nav fixed top-1/2 right-4 z-30 hidden -translate-y-1/2 xl:block"
    >
      <ul className="dot-list flex flex-col items-end gap-3">
        {model.sections.map((section) => (
          <li key={section.id} className="dot-item group relative">
            <a
              href={`#${section.id}`}
              onClick={(event) => {
                event.preventDefault();
                scrollToSection(section.id);
              }}
              aria-current={active === section.id ? 'true' : undefined}
              className="dot-link flex items-center justify-end gap-3"
            >
              <span className="dot-label pointer-events-none opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                {section.label}
              </span>
              <span aria-hidden="true" className="dot-mark block h-2.5 w-2.5 shrink-0 rounded-full" />
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
