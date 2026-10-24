'use client';

import { Mail, QrCode, Search, Sparkles } from 'lucide-react';
import { getProfiles } from '@/lib/profiles';
import { useActiveSection, useScrollProgress, initialsOf } from './hooks';
import ExternalLink from './ExternalLink';
import ProfileIcon from './ProfileIcon';
import ResumeButton from './ResumeButton';
import ThemeToggle from './ThemeToggle';
import { usePortfolio } from './PortfolioProvider';

// The fixed profile column of the split look (desktop only; small screens use the top bar)
export default function Sidebar() {
  const { content, model, settings, role, setRole, toggleDialog, openDialog, scrollToSection, t } =
    usePortfolio();
  const { personalInfo } = content;
  const profiles = getProfiles(personalInfo);
  const active = useActiveSection(model.sections.map((s) => s.id));
  const progressRef = useScrollProgress();

  return (
    <aside
      aria-label="Profile"
      className="border-line bg-surface relative hidden border-r xl:flex xl:h-screen xl:flex-col xl:overflow-y-auto xl:px-6 xl:py-8"
    >
      <a href="#top" className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="bg-accent flex h-11 w-11 items-center justify-center rounded-xl text-sm font-bold text-white"
        >
          {initialsOf(personalInfo.shortName)}
        </span>
        <span>
          <span className="text-ink block text-lg leading-tight font-semibold tracking-tight">
            {personalInfo.shortName}
          </span>
          <span className="text-muted block text-sm">{personalInfo.title}</span>
        </span>
      </a>

      {settings.features.roleSwitch && !model.roles.isEmpty && (
        <div className="mt-8">
          <p className="mono-label mb-2">{t('hero.viewAs')}</p>
          <div role="group" aria-label={t('hero.viewAs')} className="grid grid-cols-1 gap-1.5">
            {model.roles.switchOptions.map((id) => (
              <button
                key={id}
                type="button"
                aria-pressed={role === id}
                onClick={() => setRole(id)}
                className="pill !min-h-9 justify-start"
              >
                {id === 'all' ? t('role.all') : model.roles.title(id)}
              </button>
            ))}
          </div>
        </div>
      )}

      <nav aria-label="Sections" className="mt-8">
        <p className="mono-label mb-2">Sections</p>
        <ul className="space-y-0.5">
          {model.sections.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                aria-current={active === section.id ? 'true' : undefined}
                onClick={(event) => {
                  event.preventDefault();
                  scrollToSection(section.id);
                }}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active === section.id
                    ? 'bg-accent-soft text-accent-soft-ink'
                    : 'text-muted hover:bg-card hover:text-ink'
                }`}
              >
                <span className="font-mono text-[11px] tabular-nums opacity-70">
                  {section.number}
                </span>
                {section.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-auto space-y-3 pt-8">
        <ResumeButton variant="primary" className="w-full" />
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1">
            {settings.features.searchPalette && (
              <button
                type="button"
                onClick={() => toggleDialog('palette')}
                className="btn-ghost h-10 !px-2.5"
                aria-label="Search the portfolio"
                aria-haspopup="dialog"
              >
                <Search aria-hidden="true" className="h-[18px] w-[18px]" />
              </button>
            )}
            {settings.features.quickView && (
              <button
                type="button"
                onClick={() => openDialog('quick')}
                className="btn-ghost h-10 !px-2.5"
                aria-label="Open the 30-second summary"
                aria-haspopup="dialog"
              >
                <Sparkles aria-hidden="true" className="h-[18px] w-[18px]" />
              </button>
            )}
            {settings.features.shareTools && (
              <button
                type="button"
                onClick={() => openDialog('share')}
                className="btn-ghost h-10 !px-2.5"
                aria-label="Share, QR code and save contact"
                aria-haspopup="dialog"
              >
                <QrCode aria-hidden="true" className="h-[18px] w-[18px]" />
              </button>
            )}
            <ThemeToggle />
          </div>
          <ul className="flex items-center gap-0.5" aria-label="Profiles">
            {profiles.map((profile) => (
              <li key={profile.id}>
                <ExternalLink
                  href={profile.url}
                  showIcon={false}
                  className="btn-ghost h-10 !px-2.5"
                >
                  <ProfileIcon kind={profile.kind} className="h-[18px] w-[18px]" />
                  <span className="sr-only">{profile.label}</span>
                </ExternalLink>
              </li>
            ))}
            <li>
              <a href={`mailto:${personalInfo.email}`} className="btn-ghost h-10 !px-2.5">
                <Mail aria-hidden="true" className="h-[18px] w-[18px]" />
                <span className="sr-only">Email</span>
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-0.5 overflow-hidden">
        <div
          ref={progressRef}
          className="bg-accent h-full origin-left"
          style={{ transform: 'scaleX(0)' }}
        />
      </div>
    </aside>
  );
}
