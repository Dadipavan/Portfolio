'use client';

import type { SectionId } from '@/lib/types';
import Reveal from './Reveal';
import { usePortfolio } from './PortfolioProvider';

interface SectionProps {
  id: SectionId;
  number: string;
  children: React.ReactNode;
}

// The frame around every section: its number, name, heading and intro line (all editable in Admin > Text and labels).
// The section-* classes carry no styling of their own: the looks use them to arrange sections differently.
export default function Section({ id, number, children }: SectionProps) {
  const { t } = usePortfolio();
  const label = t(`section.${id}.label`);
  const title = t(`section.${id}.title`);
  const intro = t(`section.${id}.intro`);

  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className="section-frame py-14 sm:py-24"
    >
      <div className="container-page section-wrap" data-section={id}>
        <Reveal className="section-head">
          <p className="eyebrow section-eyebrow flex items-center gap-3 font-mono">
            <span className="section-number tabular-nums">{number}</span>
            <span aria-hidden="true" className="section-rule bg-accent/40 h-px w-8" />
            <span className="section-label">{label}</span>
          </p>
          <h2
            id={`${id}-heading`}
            className="section-title text-ink mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl"
          >
            {title}
          </h2>
          {intro && (
            <p className="section-intro text-muted mt-4 max-w-2xl text-lg leading-relaxed">
              {intro}
            </p>
          )}
        </Reveal>
        <div className="section-body mt-8 sm:mt-12">{children}</div>
      </div>
    </section>
  );
}
