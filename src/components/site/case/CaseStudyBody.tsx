'use client';

import type { ReactNode } from 'react';
import { ExternalLink as LinkIcon, Github } from 'lucide-react';
import {
  customSections,
  galleryOf,
  keyFeatureList,
  metricList,
  visualFirst,
  writtenSections,
} from '@/lib/caseStudy';
import type { Translate } from '@/lib/copy';
import type { RoleSet } from '@/lib/roles';
import type { Project } from '@/lib/types';
import ExternalLink from '../ExternalLink';
import Markdown from '../Markdown';
import Gallery from './Gallery';

interface CaseStudyBodyProps {
  project: Project;
  roles: RoleSet;
  t: Translate;
  // how a technology is drawn (the site makes it open the explorer); plain chips by default
  renderTag?: (label: string) => ReactNode;
  // the live demo inside the page, when it is switched on for the project
  demo?: ReactNode;
}

const scrollTo = (id: string) => (event: React.MouseEvent) => {
  event.preventDefault();
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  document
    .getElementById(id)
    ?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
};

// Everything the admin wrote about a project, laid out for reading. Nothing is added that was not written:
// a part with no text does not appear. Pictures come first for dashboards and screenshots, after the story otherwise.
export default function CaseStudyBody({ project, roles, t, renderTag, demo }: CaseStudyBodyProps) {
  const prefix = `case-${project.id}`;
  const written = writtenSections(project);
  const custom = customSections(project);
  const features = keyFeatureList(project);
  const metrics = metricList(project);
  const gallery = galleryOf(project);
  const first = visualFirst(project);
  const showLive = project.liveUrl && project.liveUrl !== project.githubUrl;
  const technologies = Array.from(
    new Map(
      [...project.technologies, ...(project.tools ?? [])].map((label) => [
        label.toLowerCase(),
        label,
      ])
    ).values()
  );
  const tag = renderTag ?? ((label: string) => <span className="chip">{label}</span>);
  const projectRoles = roles.projectRoles(project);

  const heading = (id: string, text: string) => (
    <h3 id={`${prefix}-${id}-title`} className="text-ink mb-3 text-xl font-semibold tracking-tight">
      {text}
    </h3>
  );

  // the parts, in the order they are told, for the page and for the list of contents
  const parts: { id: string; title: string; node: ReactNode }[] = [];

  const galleryPart = gallery.length > 0 && {
    id: 'visuals',
    title: t('case.visuals'),
    node: <Gallery items={gallery} title={project.title} />,
  };
  if (first && galleryPart) parts.push(galleryPart);

  written
    .filter((section) => section.key === 'overview')
    .forEach((section) =>
      parts.push({
        id: section.key,
        title: t(section.copy),
        node: <Markdown source={section.body} media={project.media} headingOffset={3} />,
      })
    );

  if (metrics.length > 0) {
    parts.push({
      id: 'numbers',
      title: t('case.numbers'),
      node: (
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {metrics.map((metric) => (
            <div key={metric.label} className="border-line bg-surface rounded-xl border p-4">
              <dd className="text-ink font-mono text-2xl font-semibold tabular-nums">
                {metric.value}
              </dd>
              <dt className="text-muted text-sm">{metric.label}</dt>
            </div>
          ))}
        </dl>
      ),
    });
  }

  written
    .filter((section) => section.key !== 'overview')
    .forEach((section) => {
      // the key features list belongs after the implementation, and the pictures after the story when text comes first
      parts.push({
        id: section.key,
        title: t(section.copy),
        node: <Markdown source={section.body} media={project.media} headingOffset={3} />,
      });
      if (section.key === 'implementation' && features.length > 0) {
        parts.push({
          id: 'features',
          title: t('case.features'),
          node: (
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {features.map((feature) => (
                <li
                  key={feature}
                  className="border-line bg-surface flex gap-3 rounded-lg border px-3 py-2 text-sm"
                >
                  <span
                    aria-hidden="true"
                    className="bg-accent mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                  />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          ),
        });
      }
    });

  if (features.length > 0 && !written.some((section) => section.key === 'implementation')) {
    parts.push({
      id: 'features',
      title: t('case.features'),
      node: (
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {features.map((feature) => (
            <li
              key={feature}
              className="border-line bg-surface flex gap-3 rounded-lg border px-3 py-2 text-sm"
            >
              <span
                aria-hidden="true"
                className="bg-accent mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
              />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      ),
    });
  }

  custom.forEach((section) =>
    parts.push({
      id: `custom-${section.id}`,
      title: section.title,
      node: <Markdown source={section.body} media={project.media} headingOffset={3} />,
    })
  );

  if (!first && galleryPart) parts.push(galleryPart);

  if (technologies.length > 0) {
    parts.push({
      id: 'tools',
      title: t('case.tools'),
      node: (
        <ul className="flex flex-wrap gap-2">
          {technologies.map((label) => (
            <li key={label}>{tag(label)}</li>
          ))}
        </ul>
      ),
    });
  }

  const facts = [
    project.category && { label: 'Category', value: project.category },
    project.role && { label: 'My role', value: project.role },
    project.teamSize
      ? {
          label: 'Team',
          value: `${project.teamSize} ${project.teamSize === 1 ? 'person' : 'people'}`,
        }
      : null,
    (project.startDate || project.endDate) && {
      label: 'When',
      value: [project.startDate, project.endDate].filter(Boolean).join(' to '),
    },
    project.status &&
      project.status !== 'completed' && {
        label: 'Status',
        value: project.status.replace('-', ' '),
      },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {projectRoles.map((id) => (
          <span key={id} data-track={roles.palette(id)} className="track-chip">
            <span className="track-dot" />
            {roles.label(id)}
          </span>
        ))}
        {project.category && <span className="chip">{project.category}</span>}
        {project.year && <span className="chip">{project.year}</span>}
      </div>

      {project.description && (
        <p className="text-muted mb-6 max-w-3xl text-lg leading-relaxed">{project.description}</p>
      )}

      {(project.githubUrl || showLive) && (
        <div className="mb-8 flex flex-wrap gap-3">
          {project.githubUrl && (
            <ExternalLink href={project.githubUrl} showIcon={false} className="btn-secondary">
              <Github aria-hidden="true" className="h-4 w-4" />
              {t('case.code')}
            </ExternalLink>
          )}
          {showLive && (
            <ExternalLink href={project.liveUrl!} showIcon={false} className="btn-primary">
              <LinkIcon aria-hidden="true" className="h-4 w-4" />
              {t('case.live')}
            </ExternalLink>
          )}
          {demo}
        </div>
      )}

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_13rem] lg:gap-10">
        <div className="min-w-0 space-y-10">
          {parts.map((part) => (
            <section
              key={part.id}
              id={`${prefix}-${part.id}`}
              aria-labelledby={`${prefix}-${part.id}-title`}
              className="scroll-mt-24"
            >
              {heading(part.id, part.title)}
              {part.node}
            </section>
          ))}
          {parts.length === 0 && !project.description && (
            <p className="text-muted">Nothing more has been written about this project yet.</p>
          )}
        </div>

        {(facts.length > 0 || parts.length > 2) && (
          <aside className="mt-10 space-y-6 lg:mt-0">
            {facts.length > 0 && (
              <div>
                <h3 className="mono-label mb-3">{t('case.facts')}</h3>
                <dl className="border-line bg-surface space-y-3 rounded-xl border p-4 text-sm">
                  {facts.map((fact) => (
                    <div key={fact.label}>
                      <dt className="text-subtle text-xs">{fact.label}</dt>
                      <dd className="text-ink font-medium first-letter:uppercase">{fact.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
            {parts.length > 2 && (
              <nav aria-label={t('case.contents')} className="hidden lg:sticky lg:top-24 lg:block">
                <h3 className="mono-label mb-3">{t('case.contents')}</h3>
                <ul className="space-y-1.5 text-sm">
                  {parts.map((part) => (
                    <li key={part.id}>
                      <a
                        href={`#${prefix}-${part.id}`}
                        onClick={scrollTo(`${prefix}-${part.id}`)}
                        className="text-muted hover:text-accent-ink block rounded py-0.5"
                      >
                        {part.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
