'use client';

import { Quote } from 'lucide-react';
import Section from './Section';
import ExternalLink from './ExternalLink';
import { usePortfolio } from './PortfolioProvider';

// Genuine quotes from mentors and teammates (managed in Admin > Recommendations)
export default function Recommendations({ number }: { number: string }) {
  const { content, t } = usePortfolio();

  return (
    <Section id="recommendations" number={number}>
      <ul className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {content.recommendations.map((item) => (
          <li key={item.id} id={`recommendation-${item.id}`} data-flash className="card p-6">
            <figure className="flex h-full flex-col">
              <Quote aria-hidden="true" className="text-accent-ink h-6 w-6 opacity-60" />
              <blockquote className="text-body mt-3 flex-1 leading-relaxed">
                {item.quote}
              </blockquote>
              <figcaption className="border-line mt-5 border-t pt-4">
                <p className="text-ink font-semibold">{item.name}</p>
                {(item.role || item.relation) && (
                  <p className="text-muted text-sm">
                    {[item.role, item.relation].filter(Boolean).join(' · ')}
                  </p>
                )}
                {item.link && (
                  <ExternalLink
                    href={item.link}
                    className="text-accent-ink mt-1 inline-flex items-center gap-1 text-sm font-medium hover:underline"
                  >
                    {t('recs.link')}
                  </ExternalLink>
                )}
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </Section>
  );
}
