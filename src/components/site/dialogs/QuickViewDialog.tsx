'use client';

import { useEffect } from 'react';
import { ArrowRight, Mail } from 'lucide-react';
import { filterProjects, DEFAULT_FILTERS } from '@/lib/query';
import { getProfiles } from '@/lib/profiles';
import Modal from '../Modal';
import { usePortfolio } from '../PortfolioProvider';
import ResumeButton from '../ResumeButton';
import ExternalLink from '../ExternalLink';
import ProfileIcon from '../ProfileIcon';
import RoleIcon from '../RoleIcon';

// The recruiter view: who, what fits, the best work, the numbers, how to reach me. One screen.
export default function QuickViewDialog() {
  const {
    content,
    model,
    dialogs,
    closeDialog,
    role,
    setRole,
    scrollToSection,
    openProject,
    track,
    t,
  } = usePortfolio();
  const open = dialogs.quick;
  const { personalInfo, siteSettings } = content;

  useEffect(() => {
    if (open) track('quick_view');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const close = () => closeDialog('quick');
  const pool = filterProjects(content.projects, { ...DEFAULT_FILTERS, role }, model.roles);
  const profiles = getProfiles(personalInfo);
  const top = [...pool.filter((p) => p.featured), ...pool.filter((p) => !p.featured)].slice(0, 3);

  const topSkills = Array.from(new Set(content.technicalSkills.flatMap((c) => c.skills))).slice(
    0,
    14
  );
  const study = content.education[0];

  return (
    <Modal
      open={open}
      onClose={close}
      size="lg"
      title={personalInfo.name}
      description={`${personalInfo.title}${role !== 'all' ? ` · ${t('hero.viewingAs', { role: model.roles.title(role) }).toLowerCase()}` : ''}`}
    >
      <div className="grid grid-cols-1 gap-6">
        {siteSettings.availability.enabled && siteSettings.availability.text && (
          <p className="badge-ok self-start">
            <span
              className="h-2 w-2 rounded-full bg-green-600 dark:bg-green-400"
              aria-hidden="true"
            />
            {siteSettings.availability.text}
          </p>
        )}

        {model.roleStats.length > 0 && (
          <section aria-labelledby="qv-fit">
            <h3
              id="qv-fit"
              className="text-muted mb-3 text-sm font-semibold tracking-wider uppercase"
            >
              {t('quick.fit')}
            </h3>
            <ul
              className={`grid grid-cols-2 gap-2 ${model.roleStats.length <= 4 ? 'sm:grid-cols-4' : 'sm:grid-cols-3'}`}
            >
              {model.roleStats.map((stat) => (
                <li key={stat.id} data-track={model.roles.palette(stat.id)}>
                  <button
                    type="button"
                    aria-pressed={role === stat.id}
                    onClick={() => setRole(stat.id)}
                    className="flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-colors"
                    style={{
                      color: 'var(--track-fg)',
                      backgroundColor: 'var(--track-bg)',
                      borderColor: role === stat.id ? 'var(--track-dot)' : 'var(--track-line)',
                    }}
                  >
                    <RoleIcon id={stat.id} className="h-4 w-4 shrink-0" />
                    <span>
                      {stat.label}
                      <span className="block text-xs font-normal opacity-80">
                        {stat.projectCount} project{stat.projectCount === 1 ? '' : 's'}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section aria-labelledby="qv-numbers">
          <h3 id="qv-numbers" className="sr-only">
            Key numbers
          </h3>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {model.kpis.map((kpi) => (
              <div key={kpi.label} className="border-line bg-surface rounded-xl border p-4">
                <dd className="text-ink font-mono text-2xl font-semibold">{kpi.value}</dd>
                <dt className="text-muted text-sm">{kpi.label}</dt>
              </div>
            ))}
          </dl>
        </section>

        {top.length > 0 && (
          <section aria-labelledby="qv-work">
            <h3
              id="qv-work"
              className="text-muted mb-3 text-sm font-semibold tracking-wider uppercase"
            >
              {role !== 'all'
                ? t('quick.workFor', { role: model.roles.title(role) })
                : t('quick.work')}
            </h3>
            <ul className="space-y-2">
              {top.map((project) => (
                <li key={project.id}>
                  <button
                    type="button"
                    className="border-line bg-surface hover:border-accent flex w-full items-start justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors"
                    onClick={() => {
                      close();
                      openProject(project.id);
                    }}
                  >
                    <span>
                      <span className="text-ink font-medium">{project.title}</span>
                      <span className="text-muted block text-sm">{project.subtitle}</span>
                      <span className="text-subtle mt-1 block text-xs">
                        {project.technologies.slice(0, 5).join(' · ')}
                      </span>
                    </span>
                    <ArrowRight aria-hidden="true" className="text-muted mt-1 h-4 w-4 shrink-0" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section aria-labelledby="qv-skills">
          <h3
            id="qv-skills"
            className="text-muted mb-3 text-sm font-semibold tracking-wider uppercase"
          >
            {t('quick.skills')}
          </h3>
          <ul className="flex flex-wrap gap-2">
            {topSkills.map((skill) => (
              <li key={skill} className="chip">
                {skill}
              </li>
            ))}
          </ul>
        </section>

        {study && (
          <p className="text-body text-sm">
            <span className="text-ink font-medium">{study.degree}</span>, {study.institution}
            {personalInfo.cgpa ? ` · CGPA ${personalInfo.cgpa}` : ''}
            {personalInfo.graduation ? ` · ${personalInfo.graduation}` : ''}
          </p>
        )}

        <div className="border-line flex flex-wrap items-center gap-3 border-t pt-5">
          <ResumeButton variant="primary" />
          <a href={`mailto:${personalInfo.email}`} className="btn-secondary">
            <Mail aria-hidden="true" className="h-4 w-4" />
            {personalInfo.email}
          </a>
          {profiles.map((profile) => (
            <ExternalLink
              key={profile.id}
              href={profile.url}
              showIcon={false}
              className="btn-ghost"
            >
              <ProfileIcon kind={profile.kind} className="h-4 w-4" />
              {profile.label}
            </ExternalLink>
          ))}
          <button
            type="button"
            className="btn-ghost ml-auto"
            onClick={() => {
              close();
              scrollToSection('about');
            }}
          >
            {t('quick.full')}
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Modal>
  );
}
