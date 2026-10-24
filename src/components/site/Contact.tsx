'use client';

import { Mail, MapPin, Phone } from 'lucide-react';
import { getProfiles } from '@/lib/profiles';
import Section from './Section';
import ContactForm from './ContactForm';
import CopyEmailButton from './CopyEmailButton';
import ExternalLink from './ExternalLink';
import ProfileIcon from './ProfileIcon';
import { usePortfolio } from './PortfolioProvider';

export default function Contact({ number }: { number: string }) {
  const { content, t } = usePortfolio();
  const info = content.personalInfo;
  const profiles = getProfiles(info);

  const row =
    'flex items-center gap-4 rounded-xl border border-line bg-card p-4 text-body transition-colors hover:border-line-strong hover:text-ink';
  const tile =
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent-ink';

  return (
    <Section id="contact" number={number}>
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
        <ul className="space-y-3">
          <li className="flex flex-wrap items-center gap-3">
            <a href={`mailto:${info.email}`} className={`${row} min-w-0 flex-1 basis-[19rem]`}>
              <span className={tile}>
                <Mail aria-hidden="true" className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="mono-label block">{t('contact.emailLabel')}</span>
                <span className="block font-medium break-all">{info.email}</span>
              </span>
            </a>
            <CopyEmailButton email={info.email} />
          </li>
          {info.phone && (
            <li>
              <a href={`tel:${info.phone.replace(/[^+\d]/g, '')}`} className={row}>
                <span className={tile}>
                  <Phone aria-hidden="true" className="h-5 w-5" />
                </span>
                <span>
                  <span className="mono-label block">{t('contact.phoneLabel')}</span>
                  <span className="block font-medium">{info.phone}</span>
                </span>
              </a>
            </li>
          )}
          {profiles.map((profile) => (
            <li key={profile.id}>
              <ExternalLink href={profile.url} showIcon={false} className={row}>
                <span className={tile}>
                  <ProfileIcon kind={profile.kind} className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="mono-label block">{profile.label}</span>
                  <span className="block font-medium break-words">
                    {profile.kind === 'linkedin'
                      ? t('contact.linkedinText')
                      : profile.kind === 'github'
                        ? t('contact.githubText')
                        : profile.url.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '')}
                  </span>
                </span>
              </ExternalLink>
            </li>
          ))}
          {info.location && (
            <li className="text-muted flex items-center gap-4 p-4">
              <span className={tile}>
                <MapPin aria-hidden="true" className="h-5 w-5" />
              </span>
              <span className="text-sm">{info.location}</span>
            </li>
          )}
        </ul>

        <ContactForm fallbackEmail={info.email} />
      </div>
    </Section>
  );
}
