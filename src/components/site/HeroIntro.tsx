'use client';

import { ArrowRight, Mail, Zap } from 'lucide-react';
import { DATA_STYLE_FEATURES } from '@/lib/siteSettings';
import { resolveRoleView } from '@/lib/roles';
import { getProfiles } from '@/lib/profiles';
import ExternalLink from './ExternalLink';
import ProfileIcon from './ProfileIcon';
import ResumeButton from './ResumeButton';
import RoleSwitch from './RoleSwitch';
import { usePortfolio } from './PortfolioProvider';

interface HeroIntroProps {
  align?: 'left' | 'center';
  // a larger name, for looks where the intro is the centrepiece
  large?: boolean;
  gradient?: boolean;
  showRoleSwitch?: boolean;
  roleSwitchClassName?: string;
  headingId?: string;
}

// A long name gets a smaller type size so it sits on one or two tidy lines on every screen
function nameSize(name: string, large: boolean): string {
  const length = name.trim().length;
  if (length <= 12)
    return large
      ? 'text-6xl sm:text-7xl lg:text-8xl'
      : 'text-6xl sm:text-7xl lg:text-[5.25rem] lg:leading-[1.02]';
  if (length <= 20)
    return large
      ? 'text-5xl sm:text-6xl lg:text-7xl'
      : 'text-5xl sm:text-6xl lg:text-7xl lg:leading-[1.04]';
  return large
    ? 'text-4xl sm:text-5xl lg:text-6xl'
    : 'text-4xl sm:text-5xl lg:text-[3.6rem] lg:leading-[1.06]';
}

// The introduction at the top of every look: name, role, a line about me, and the main actions
export default function HeroIntro({
  align = 'left',
  large = false,
  gradient = false,
  showRoleSwitch = true,
  roleSwitchClassName = '',
  headingId = 'hero-heading',
}: HeroIntroProps) {
  const { content, settings, model, role, openDialog, scrollToSection, t } = usePortfolio();
  const { personalInfo } = content;
  const { availability } = settings;
  const roleView = resolveRoleView(role, model.roles);
  const profiles = getProfiles(personalInfo);
  const dataStyle = DATA_STYLE_FEATURES.some((id) => settings.features[id]);
  const center = align === 'center';

  const link = 'btn-ghost !min-h-10';

  return (
    <div className={`hero-intro animate-fade-up ${center ? 'mx-auto max-w-3xl text-center' : ''}`}>
      <div className={`mb-6 flex flex-wrap items-center gap-3 ${center ? 'justify-center' : ''}`}>
        {availability.enabled && availability.text && (
          <p className="badge-ok">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping-soft absolute inline-flex h-full w-full rounded-full bg-green-500" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-600 dark:bg-green-400" />
            </span>
            {availability.text}
          </p>
        )}
        {dataStyle && settings.kicker && (
          <p className="kicker">
            <Zap aria-hidden="true" className="h-3.5 w-3.5" />
            {settings.kicker}
            <span aria-hidden="true" className="animate-caret -ml-1">
              _
            </span>
          </p>
        )}
      </div>

      <p className="hero-greeting text-muted text-lg font-medium">{t('hero.greeting')}</p>
      <h1
        id={headingId}
        className={`hero-name text-ink mt-1 font-semibold tracking-tight text-balance ${gradient ? 'gradient-text' : ''} ${nameSize(
          personalInfo.shortName,
          large
        )}`}
      >
        {personalInfo.shortName}
        {personalInfo.name !== personalInfo.shortName && (
          <span className="sr-only"> ({personalInfo.name})</span>
        )}
      </h1>
      <p className="hero-role text-accent-ink mt-5 text-xl font-semibold sm:text-2xl">
        {roleView?.headline || personalInfo.title}
      </p>
      {!roleView?.headline && personalInfo.subtitle && (
        <p className="hero-subtitle text-muted mt-1 text-base">{personalInfo.subtitle}</p>
      )}
      {role !== 'all' && (
        <p className="mono-label mt-3" aria-live="polite">
          {t('hero.viewingAs', { role: model.roles.title(role) })}
        </p>
      )}
      <p
        className={`hero-summary text-muted mt-6 max-w-xl text-lg leading-relaxed ${center ? 'mx-auto' : ''}`}
      >
        {roleView?.summary || personalInfo.description}
      </p>

      <div
        className={`hero-actions mt-8 flex flex-wrap items-center gap-3 ${center ? 'justify-center' : ''}`}
      >
        <a
          href="#projects"
          className="btn-primary"
          onClick={(event) => {
            event.preventDefault();
            scrollToSection('projects');
          }}
        >
          {t('hero.viewProjects')}
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </a>
        <ResumeButton />
        {settings.features.quickView && (
          <button
            type="button"
            className="btn-secondary"
            onClick={() => openDialog('quick')}
            aria-haspopup="dialog"
          >
            {t('hero.summaryButton')}
          </button>
        )}
      </div>

      {showRoleSwitch && settings.features.roleSwitch && (
        <div className={`mt-6 ${roleSwitchClassName}`}>
          <RoleSwitch center={center} />
        </div>
      )}

      <ul
        className={`hero-profiles mt-6 flex flex-wrap items-center gap-1 ${center ? 'justify-center' : ''}`}
        aria-label="Profiles"
      >
        {profiles.map((profile) => (
          <li key={profile.id}>
            <ExternalLink href={profile.url} showIcon={false} className={link}>
              <ProfileIcon kind={profile.kind} className="h-4 w-4" />
              {profile.label}
            </ExternalLink>
          </li>
        ))}
        <li>
          <a href={`mailto:${personalInfo.email}`} className={link}>
            <Mail aria-hidden="true" className="h-4 w-4" />
            Email
          </a>
        </li>
      </ul>
    </div>
  );
}
