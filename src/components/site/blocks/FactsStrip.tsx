'use client';

import { usePortfolio } from '../PortfolioProvider';

// Education, graduation and location at a glance. CGPA is left out when the number tiles already show it.
export default function FactsStrip({
  className = '',
  stacked = false,
}: {
  className?: string;
  stacked?: boolean;
}) {
  const { content, model, t } = usePortfolio();
  const { personalInfo, education } = content;
  const study = education[0];
  const cgpaShown = model.kpis.some((k) => k.label.toLowerCase().includes('cgpa'));

  const facts = [
    study && { label: t('facts.education'), value: study.degree, detail: study.institution },
    !cgpaShown && personalInfo.cgpa && { label: 'CGPA', value: personalInfo.cgpa },
    personalInfo.graduation && { label: t('facts.graduation'), value: personalInfo.graduation },
    personalInfo.location && { label: t('facts.basedIn'), value: personalInfo.location },
  ].filter(Boolean) as { label: string; value: string; detail?: string }[];

  if (facts.length === 0) return null;

  return (
    <dl
      className={`facts-strip border-line bg-line shadow-card flex gap-px overflow-hidden rounded-2xl border ${stacked ? 'flex-col' : 'flex-wrap'} ${className}`}
    >
      {facts.map((fact) => (
        <div
          key={fact.label}
          className={`facts-item bg-card p-5 ${stacked ? 'flex-1' : 'min-w-[13rem] flex-1 basis-[13rem]'}`}
        >
          <dt className="mono-label">{fact.label}</dt>
          <dd className="text-ink mt-1.5 font-semibold">{fact.value}</dd>
          {fact.detail && <dd className="text-muted mt-0.5 text-sm">{fact.detail}</dd>}
        </div>
      ))}
    </dl>
  );
}
