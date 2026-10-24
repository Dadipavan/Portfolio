'use client';

import { CalendarCheck, Mail, MapPin, MessageSquare, Send, Timer } from 'lucide-react';
import Section from './Section';
import ResumeButton from './ResumeButton';
import ExternalLink from './ExternalLink';
import { usePortfolio } from './PortfolioProvider';

// What I am looking for and how to start a conversation (edited in Admin > Site settings)
export default function WorkWithMe({ number }: { number: string }) {
  const { content, settings, scrollToSection, openDialog, t } = usePortfolio();
  const work = settings.workWithMe;
  const { availability } = settings;
  const info = content.personalInfo;

  const details = [
    { icon: MapPin, label: t('work.basedIn'), value: work.location || info.location },
    { icon: Send, label: t('work.remote'), value: work.remote },
    { icon: Timer, label: t('work.available'), value: work.startDate },
    { icon: Mail, label: t('work.reach'), value: work.contact || info.email },
  ].filter((d) => d.value);

  return (
    <Section id="work" number={number}>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="card p-6 sm:p-8">
          {availability.enabled && availability.text && (
            <p className="badge-ok mb-5">
              <span
                className="h-2 w-2 rounded-full bg-green-600 dark:bg-green-400"
                aria-hidden="true"
              />
              {availability.text}
            </p>
          )}
          {work.roles.length > 0 && (
            <>
              <h3 className="mono-label">{t('work.roles')}</h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {work.roles.map((role) => (
                  <li
                    key={role}
                    className="bg-accent-soft text-accent-soft-ink rounded-full px-3.5 py-1.5 text-sm font-semibold"
                  >
                    {role}
                  </li>
                ))}
              </ul>
            </>
          )}
          {work.note && (
            <p className="text-body mt-5 leading-relaxed whitespace-pre-line">{work.note}</p>
          )}

          <div className="mt-7 flex flex-wrap items-center gap-3">
            {work.bookingUrl && (
              <ExternalLink href={work.bookingUrl} showIcon={false} className="btn-primary">
                <CalendarCheck aria-hidden="true" className="h-4 w-4" />
                {t('work.book')}
              </ExternalLink>
            )}
            <button
              type="button"
              className={work.bookingUrl ? 'btn-secondary' : 'btn-primary'}
              onClick={() => scrollToSection('contact')}
            >
              <MessageSquare aria-hidden="true" className="h-4 w-4" />
              {t('work.message')}
            </button>
            <ResumeButton />
            {settings.features.quickView && (
              <button type="button" className="btn-secondary" onClick={() => openDialog('quick')}>
                {t('hero.summaryButton')}
              </button>
            )}
          </div>
        </div>

        {details.length > 0 && (
          <dl className="card divide-line divide-y p-2">
            {details.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-4 p-4">
                <span className="bg-accent-soft text-accent-ink flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                  <Icon aria-hidden="true" className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0">
                  <dt className="mono-label">{label}</dt>
                  <dd className="text-ink mt-0.5 font-medium break-words">{value}</dd>
                </div>
              </div>
            ))}
          </dl>
        )}
      </div>
    </Section>
  );
}
