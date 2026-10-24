'use client';

import { Award, CalendarDays, GraduationCap, MapPin, Sparkles, Target } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Section from './Section';
import { usePortfolio } from './PortfolioProvider';

// Stored quick facts start with an emoji; this design uses its own icons, so the emoji is dropped.
const stripLeadingSymbols = (value: string) => value.replace(/^[^\p{L}\p{N}]+/u, '').trim();

// Same order as the previous homepage: location, CGPA, graduation, scholarship, then anything else
const FACT_ORDER = ['location', 'cgpa', 'graduation', 'scholarship'];

const FACT_ICONS: Record<string, LucideIcon> = {
  location: MapPin,
  cgpa: GraduationCap,
  graduation: CalendarDays,
  scholarship: Award,
};

export default function About({ number }: { number: string }) {
  const { content, t } = usePortfolio();
  const { personalInfo, currentFocus, quickFacts } = content;

  const facts = Object.entries(quickFacts ?? {})
    .map(([key, value]) => ({ key, text: stripLeadingSymbols(String(value)) }))
    .filter((fact) => fact.text)
    .sort((a, b) => {
      const rank = (key: string) =>
        FACT_ORDER.includes(key) ? FACT_ORDER.indexOf(key) : FACT_ORDER.length;
      return rank(a.key) - rank(b.key);
    });

  return (
    <Section id="about" number={number}>
      <div className="grid grid-cols-1 gap-14 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div>
          <p className="text-ink text-xl leading-relaxed">{personalInfo.about}</p>

          {facts.length > 0 && (
            <>
              <h3 className="mono-label mt-10">{t('about.quickFacts')}</h3>
              <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {facts.map((fact) => {
                  const Icon = FACT_ICONS[fact.key] ?? Sparkles;
                  return (
                    <li
                      key={fact.key}
                      className="border-line bg-card flex items-start gap-3 rounded-xl border p-4"
                    >
                      <span className="bg-accent-soft text-accent-ink flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                        <Icon aria-hidden="true" className="h-4 w-4" />
                      </span>
                      <span className="text-ink pt-1 text-sm leading-snug font-medium">
                        {fact.text}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>

        {currentFocus.length > 0 && (
          <div>
            <h3 className="mono-label">{t('about.currentFocus')}</h3>
            <ul className="mt-4 space-y-4">
              {currentFocus.map((focus) => (
                <li key={focus.title} className="card flex items-start gap-4 p-5">
                  <span
                    aria-hidden="true"
                    className="bg-accent-soft text-accent-ink flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl"
                  >
                    {focus.icon ? focus.icon : <Target className="h-5 w-5" />}
                  </span>
                  <div>
                    <p className="text-ink font-semibold">{focus.title}</p>
                    <p className="text-muted mt-1 text-sm leading-relaxed">{focus.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Section>
  );
}
