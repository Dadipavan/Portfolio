'use client';

import Section from './Section';
import { usePortfolio } from './PortfolioProvider';

export default function Experience({ number }: { number: string }) {
  const { content } = usePortfolio();
  const items = content.experience;

  return (
    <Section id="experience" number={number}>
      <ol className="space-y-8">
        {items.map((item, index) => (
          <li
            key={item.id}
            id={`experience-${item.id}`}
            data-flash
            className="grid grid-cols-1 gap-4 rounded-2xl md:grid-cols-[11rem_1.5rem_minmax(0,1fr)] md:gap-x-6"
          >
            <div className="md:pt-6 md:text-right">
              <p className="text-ink font-mono text-sm font-semibold tabular-nums">{item.period}</p>
              {item.type && <p className="text-muted mt-1 text-sm">{item.type}</p>}
              {item.location && <p className="text-muted mt-0.5 text-sm">{item.location}</p>}
            </div>

            {/* Timeline marker (desktop) */}
            <div aria-hidden="true" className="relative hidden md:block">
              <span className="border-accent bg-page absolute top-[1.7rem] left-1/2 h-3.5 w-3.5 -translate-x-1/2 rounded-full border-[3px]" />
              {index < items.length - 1 && (
                <span className="bg-line-strong absolute top-[2.6rem] -bottom-8 left-1/2 w-px -translate-x-1/2" />
              )}
            </div>

            <div className="card p-6">
              <h3 className="text-ink text-lg font-semibold tracking-tight">{item.title}</h3>
              <p className="text-accent-ink mt-0.5 font-medium">{item.company}</p>
              {item.description.length > 0 && (
                <ul className="text-body mt-4 space-y-2.5 text-sm leading-relaxed">
                  {item.description.map((line) => (
                    <li key={line} className="flex gap-3">
                      <span
                        aria-hidden="true"
                        className="bg-accent/60 mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                      />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}
