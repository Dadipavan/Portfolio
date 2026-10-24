'use client';

import { ArrowRight, FileText, Star } from 'lucide-react';
import Tag from '../Tag';
import RoleIcon from '../RoleIcon';
import { usePortfolio } from '../PortfolioProvider';

// A spotlight on the first featured project (used by the tile-based look)
export default function FeaturedTile({ className = '' }: { className?: string }) {
  const { content, model, openProject, openCaseStudy, settings, t } = usePortfolio();
  const project = content.projects.find((p) => p.featured) ?? content.projects[0];
  if (!project) return null;
  const primary = model.roles.projectRoles(project)[0] ?? 'none';

  return (
    <article
      data-track={model.roles.palette(primary)}
      className={`card relative overflow-hidden p-6 sm:p-8 ${className}`}
    >
      <RoleIcon
        id={primary}
        className="pointer-events-none absolute -right-4 -bottom-6 h-40 w-40 opacity-[0.07]"
      />
      <p className="mono-label flex items-center gap-2">
        <Star aria-hidden="true" className="h-3.5 w-3.5 fill-current" />
        {t('tile.featured')}
      </p>
      <h2 className="text-ink mt-3 text-2xl font-semibold tracking-tight">{project.title}</h2>
      {project.subtitle && <p className="text-accent-ink mt-1 font-medium">{project.subtitle}</p>}
      <p className="text-body mt-4 max-w-2xl leading-relaxed">{project.description}</p>
      <ul className="mt-5 flex flex-wrap gap-1.5" aria-label="Technologies">
        {project.technologies.map((tech) => (
          <li key={tech}>
            <Tag label={tech} />
          </li>
        ))}
      </ul>
      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" className="btn-primary" onClick={() => openProject(project.id)}>
          {t('tile.open')}
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </button>
        {settings.features.caseStudies && (
          <button
            type="button"
            className="btn-secondary"
            onClick={() => openCaseStudy(project.id)}
            aria-haspopup="dialog"
          >
            <FileText aria-hidden="true" className="h-4 w-4" />
            {t('projects.details')}
          </button>
        )}
      </div>
    </article>
  );
}
