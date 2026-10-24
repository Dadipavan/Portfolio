'use client';

import { Award, Briefcase, GraduationCap, Layers } from 'lucide-react';
import { scrollAndFlash } from '@/lib/dom';
import { evidenceTotal } from '@/lib/tags';
import Modal from '../Modal';
import { usePortfolio } from '../PortfolioProvider';
import ExternalLink from '../ExternalLink';

function Group({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Layers;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6 first:mt-0">
      <h3 className="text-muted mb-3 flex items-center gap-2 text-sm font-semibold tracking-wider uppercase">
        <Icon aria-hidden="true" className="h-4 w-4" />
        {title}
      </h3>
      <ul className="space-y-2">{children}</ul>
    </section>
  );
}

const rowClass =
  'flex w-full flex-col items-start rounded-xl border border-line bg-surface px-4 py-3 text-left transition-colors hover:border-accent';

// Everything in the portfolio that backs up one skill, technology or course
export default function ExplorerDialog() {
  const { model, explorerKey, closeExplorer, openTag, openProject, showProjects, content } =
    usePortfolio();
  const evidence = explorerKey ? model.evidence[explorerKey] : null;

  const jump = (id: string) => {
    closeExplorer();
    window.setTimeout(() => scrollAndFlash(id), 150);
  };

  return (
    <Modal
      open={Boolean(evidence)}
      onClose={closeExplorer}
      placement="right"
      title={evidence?.label ?? ''}
      description="Where this shows up in my work"
    >
      {evidence && (
        <>
          <ul className="mb-6 flex flex-wrap gap-2" aria-label="Summary">
            {[
              ['project', evidence.projects.length],
              ['certificate', evidence.certifications.length],
              ['course', evidence.coursework.length],
              ['role', evidence.experience.length],
            ]
              .filter(([, count]) => (count as number) > 0)
              .map(([name, count]) => (
                <li
                  key={name as string}
                  className="bg-accent-soft text-accent-soft-ink rounded-full px-3 py-1 text-sm font-semibold"
                >
                  {count as number} {name as string}
                  {(count as number) === 1 ? '' : 's'}
                </li>
              ))}
            {evidenceTotal(evidence) === 0 && (
              <li className="text-muted text-sm">Listed as a skill.</li>
            )}
          </ul>

          {evidence.projects.length > 0 && (
            <Group icon={Layers} title="Projects">
              {evidence.projects.map((project) => (
                <li key={project.id}>
                  <button
                    type="button"
                    className={rowClass}
                    onClick={() => {
                      closeExplorer();
                      openProject(project.id);
                    }}
                  >
                    <span className="text-ink font-medium">{project.title}</span>
                    <span className="text-muted text-sm">
                      {[project.subtitle, project.year].filter(Boolean).join(' · ')}
                    </span>
                  </button>
                </li>
              ))}
            </Group>
          )}

          {evidence.certifications.length > 0 && (
            <Group icon={Award} title="Certificates">
              {evidence.certifications.map((cert) => (
                <li key={cert.index} className="border-line bg-surface rounded-xl border px-4 py-3">
                  <button
                    type="button"
                    className="text-ink hover:text-accent-ink text-left font-medium"
                    onClick={() => jump(`certification-${cert.index}`)}
                  >
                    {cert.title}
                  </button>
                  <p className="text-muted text-sm">
                    {[cert.issuer, cert.year].filter(Boolean).join(' · ')}
                  </p>
                  {cert.verificationUrl && (
                    <ExternalLink
                      href={cert.verificationUrl}
                      className="text-accent-ink mt-1 inline-flex items-center gap-1 text-sm font-medium hover:underline"
                    >
                      Verify credential
                    </ExternalLink>
                  )}
                </li>
              ))}
            </Group>
          )}

          {evidence.coursework.length > 0 && (
            <Group icon={GraduationCap} title="Coursework">
              {evidence.coursework.map((course) => (
                <li key={String(course.id)}>
                  <button
                    type="button"
                    className={rowClass}
                    onClick={() => jump(`education-${course.id}`)}
                  >
                    <span className="text-ink font-medium">{course.degree}</span>
                    <span className="text-muted text-sm">
                      {[course.institution, course.period].filter(Boolean).join(' · ')}
                    </span>
                  </button>
                </li>
              ))}
            </Group>
          )}

          {evidence.experience.length > 0 && (
            <Group icon={Briefcase} title="Roles">
              {evidence.experience.map((role) => (
                <li key={String(role.id)}>
                  <button
                    type="button"
                    className={rowClass}
                    onClick={() => jump(`experience-${role.id}`)}
                  >
                    <span className="text-ink font-medium">{role.title}</span>
                    <span className="text-muted text-sm">
                      {[role.company, role.period].filter(Boolean).join(' · ')}
                    </span>
                  </button>
                </li>
              ))}
            </Group>
          )}

          {evidence.skillCategories.length > 0 && (
            <p className="text-muted mt-6 text-sm">
              Listed under{' '}
              <span className="text-ink font-medium">{evidence.skillCategories.join(', ')}</span>.
            </p>
          )}

          {evidence.related.length > 0 && (
            <section className="mt-6">
              <h3 className="text-muted mb-3 text-sm font-semibold tracking-wider uppercase">
                Often used together with
              </h3>
              <ul className="flex flex-wrap gap-2">
                {evidence.related.map((item) => (
                  <li key={item.key}>
                    <button type="button" className="tag" onClick={() => openTag(item.label)}>
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {evidence.projects.length > 0 && (
            <div className="border-line mt-8 border-t pt-5">
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  closeExplorer();
                  showProjects({
                    tech: model.techUsage[evidence.key]?.name ?? evidence.label,
                    role: 'all',
                  });
                }}
              >
                Filter the projects by {evidence.label}
              </button>
              <p className="text-muted mt-2 text-xs">
                {content.projects.length} projects in total; this shows the{' '}
                {evidence.projects.length} that use it.
              </p>
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
