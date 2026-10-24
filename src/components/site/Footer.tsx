'use client';

import { Mail, QrCode } from 'lucide-react';
import { getProfiles } from '@/lib/profiles';
import ExternalLink from './ExternalLink';
import DataMenu from './DataMenu';
import ProfileIcon from './ProfileIcon';
import { usePortfolio } from './PortfolioProvider';

export default function Footer() {
  const { content, settings, openDialog, t } = usePortfolio();
  const info = content.personalInfo;
  const profiles = getProfiles(info);
  const icon =
    'inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-ink';

  return (
    <footer className="border-line border-t py-10">
      <div className="container-page flex flex-col items-center justify-between gap-6 lg:flex-row">
        <div className="text-center lg:text-left">
          <p className="text-ink font-semibold">{info.name}</p>
          <p className="text-muted mt-1 text-sm">
            {t('footer.line', {
              year: new Date().getFullYear(),
              title: info.title,
              name: info.name,
            })}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <DataMenu />
          {settings.features.shareTools && (
            <button
              type="button"
              onClick={() => openDialog('share')}
              className="btn-secondary min-h-10"
            >
              <QrCode aria-hidden="true" className="h-4 w-4" />
              {t('footer.share')}
            </button>
          )}
          <ul className="flex items-center gap-1" aria-label="Profiles">
            {profiles.map((profile) => (
              <li key={profile.id}>
                <ExternalLink href={profile.url} showIcon={false} className={icon}>
                  <ProfileIcon kind={profile.kind} className="h-5 w-5" />
                  <span className="sr-only">{profile.label}</span>
                </ExternalLink>
              </li>
            ))}
            <li>
              <a href={`mailto:${info.email}`} className={icon}>
                <Mail aria-hidden="true" className="h-5 w-5" />
                <span className="sr-only">Email</span>
              </a>
            </li>
          </ul>
          <a href="#top" className="text-ink hover:text-accent-ink text-sm font-medium">
            {t('footer.top')}
          </a>
        </div>
      </div>
    </footer>
  );
}
