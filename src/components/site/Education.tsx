'use client';

import { GraduationCap } from 'lucide-react';
import Section from './Section';
import Tag from './Tag';
import { usePortfolio } from './PortfolioProvider';

export default function Education({ number }: { number: string }) {
  const { content, t } = usePortfolio();

  return (
    <Section id="education" number={number}>
      <ol className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {content.education.map((item) => (
          <li
            key={item.id}
            id={`education-${item.id}`}
            data-flash
            className="card card-hover flex flex-col p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="bg-accent-soft text-accent-ink flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                <GraduationCap aria-hidden="true" className="h-5 w-5" />
              </span>
              <span className="text-muted pt-1 text-right font-mono text-sm tabular-nums">
                {item.period}
              </span>
            </div>
            <h3 className="text-ink mt-5 text-lg leading-snug font-semibold tracking-tight">
              {item.degree}
            </h3>
            <p className="text-accent-ink mt-1 font-medium">{item.institution}</p>
            {item.location && <p className="text-muted mt-0.5 text-sm">{item.location}</p>}
            {item.grade && (
              <p className="bg-accent-soft text-accent-soft-ink mt-4 inline-flex self-start rounded-lg px-3 py-1.5 text-sm font-semibold">
                {item.grade}
              </p>
            )}
            {item.coursework && item.coursework.length > 0 && (
              <div className="mt-5">
                <p className="mono-label">{t('education.coursework')}</p>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {item.coursework.map((course) => (
                    <li key={course}>
                      <Tag label={course} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        ))}
      </ol>
    </Section>
  );
}
