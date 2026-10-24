'use client';

import { useMemo } from 'react';
import { ExternalLink as LinkIcon, FileText, Github, Search, Star } from 'lucide-react';
import {
  DEFAULT_FILTERS,
  buildQuery,
  filterProjects,
  isFiltering,
  type ProjectOrder,
} from '@/lib/query';
import type { Project, TrackId } from '@/lib/types';
import Section from './Section';
import ExternalLink from './ExternalLink';
import RoleIcon from './RoleIcon';
import Tag from './Tag';
import DemoPreview, { toEmbedUrl } from './DemoPreview';
import { usePortfolio } from './PortfolioProvider';

function StatusBadge({ status }: { status?: string }) {
  if (!status || status === 'completed') return null;
  const label =
    status === 'in-progress' ? 'In progress' : status === 'planned' ? 'Planned' : status;
  return (
    <span className="border-line bg-card text-muted rounded-full border px-2.5 py-0.5 text-xs font-medium">
      {label}
    </span>
  );
}

function TrackChips({ tracks }: { tracks: TrackId[] }) {
  const { model } = usePortfolio();
  if (tracks.length === 0) return null;
  return (
    <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Roles this project shows">
      {tracks.map((id) => (
        <li key={id} data-track={model.roles.palette(id)} className="track-chip">
          <span className="track-dot" />
          {model.roles.label(id)}
        </li>
      ))}
    </ul>
  );
}

function ProjectActions({ project }: { project: Project }) {
  const { settings, openCaseStudy, t } = usePortfolio();
  const showLive = project.liveUrl && project.liveUrl !== project.githubUrl;
  const link =
    'inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-line bg-card px-3 text-sm font-medium text-ink transition-colors hover:border-line-strong hover:bg-surface';
  const canEmbed =
    settings.features.demoPreviews && project.embedLive && showLive && toEmbedUrl(project.liveUrl!);

  return (
    <div className="mt-auto pt-5">
      <div className="flex flex-wrap gap-2">
        {settings.features.caseStudies && (
          <button
            type="button"
            className="bg-accent hover:bg-accent-strong inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3.5 text-sm font-semibold text-white transition-colors"
            onClick={() => openCaseStudy(project.id)}
            aria-haspopup="dialog"
            aria-label={`${t('projects.viewMore')}: ${project.title}`}
          >
            <FileText aria-hidden="true" className="h-4 w-4" />
            {t('projects.viewMore')}
          </button>
        )}
        {project.githubUrl && (
          <ExternalLink href={project.githubUrl} showIcon={false} className={link}>
            <Github aria-hidden="true" className="h-4 w-4" />
            {t('projects.code')}
          </ExternalLink>
        )}
        {showLive && (
          <ExternalLink href={project.liveUrl!} showIcon={false} className={link}>
            <LinkIcon aria-hidden="true" className="h-4 w-4" />
            {t('projects.live')}
          </ExternalLink>
        )}
        {canEmbed && <DemoPreview url={project.liveUrl!} title={project.title} />}
      </div>
    </div>
  );
}

function Technologies({ items }: { items: string[] }) {
  return (
    <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Technologies">
      {items.map((tech) => (
        <li key={tech}>
          <Tag label={tech} />
        </li>
      ))}
    </ul>
  );
}

function FeaturedCard({ project }: { project: Project }) {
  const { model, t } = usePortfolio();
  const tracks = model.roles.projectRoles(project);
  const primary = tracks[0] ?? 'none';

  return (
    <li
      id={`project-${project.id}`}
      data-flash
      tabIndex={-1}
      data-track={model.roles.palette(primary)}
      className="card card-hover flex flex-col overflow-hidden"
    >
      {/* Decorative cover tinted with the project's main role */}
      <div
        aria-hidden="true"
        className="cover-dots relative flex h-28 items-end justify-between overflow-hidden border-b px-5 pb-4"
        style={{
          backgroundColor: 'var(--track-bg)',
          borderColor: 'var(--track-line)',
          color: 'var(--track-fg)',
        }}
      >
        <span className="font-mono text-sm font-semibold tabular-nums">{project.year}</span>
        <RoleIcon id={primary} className="absolute -right-3 -bottom-5 h-28 w-28 opacity-[0.14]" />
        <span className="bg-card/90 absolute top-4 right-5 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold">
          <Star className="h-3 w-3 fill-current" />
          {t('projects.featuredBadge')}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-ink text-xl font-semibold tracking-tight">{project.title}</h3>
          <StatusBadge status={project.status} />
        </div>
        {project.subtitle && (
          <p className="text-accent-ink mt-1 text-sm font-medium">{project.subtitle}</p>
        )}
        <TrackChips tracks={tracks} />
        <p className="text-body mt-4 text-sm leading-relaxed">{project.description}</p>
        <Technologies items={project.technologies} />
        <ProjectActions project={project} />
      </div>
    </li>
  );
}

function CompactCard({ project }: { project: Project }) {
  const { model } = usePortfolio();
  const tracks = model.roles.projectRoles(project);

  return (
    <li
      id={`project-${project.id}`}
      data-flash
      tabIndex={-1}
      data-track={model.roles.palette(tracks[0])}
      className="card card-hover flex flex-col border-l-4 p-6"
      style={{ borderLeftColor: 'var(--track-dot)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <h4 className="text-ink text-lg font-semibold tracking-tight">{project.title}</h4>
        <span className="flex shrink-0 items-center gap-2">
          <StatusBadge status={project.status} />
          {project.year && (
            <span className="text-muted font-mono text-sm tabular-nums">{project.year}</span>
          )}
        </span>
      </div>
      {project.subtitle && (
        <p className="text-accent-ink mt-1 text-sm font-medium">{project.subtitle}</p>
      )}
      <TrackChips tracks={tracks} />
      <p className="text-body mt-4 text-sm leading-relaxed">{project.description}</p>
      <Technologies items={project.technologies} />
      <ProjectActions project={project} />
    </li>
  );
}

// Projects with a query bar: pick a role, technology or year and the filters are written as a query.
export default function ProjectBrowser({ number }: { number: string }) {
  const { content, model, filters, setFilters, settings, t } = usePortfolio();
  const { projects } = content;
  const queryBar = settings.features.queryBar;

  const technologies = useMemo(() => {
    const seen = new Map<string, string>();
    projects.forEach((p) =>
      p.technologies.forEach((t) => seen.set(t.toLowerCase(), seen.get(t.toLowerCase()) ?? t))
    );
    return Array.from(seen.values()).sort((a, b) => a.localeCompare(b));
  }, [projects]);
  const years = useMemo(
    () =>
      Array.from(new Set(projects.map((p) => p.year).filter((y): y is string => Boolean(y))))
        .sort()
        .reverse(),
    [projects]
  );

  const visible = useMemo(
    () => filterProjects(projects, filters, model.roles),
    [projects, filters, model.roles]
  );
  const featured = visible.filter((p) => p.featured);
  const others = visible.filter((p) => !p.featured);
  const filtering = isFiltering(filters);
  const query = buildQuery(filters);

  const roleCounts = new Map(model.roleStats.map((s) => [s.id, s.projectCount]));
  const orders: { id: ProjectOrder; label: string }[] = [
    { id: 'manual', label: t('projects.orderManual') },
    { id: 'year-desc', label: t('projects.orderNewest') },
    { id: 'year-asc', label: t('projects.orderOldest') },
  ];

  return (
    <Section id="projects" number={number}>
      <div className="card p-4 sm:p-5">
        {model.roles.list.length > 0 && (
          <div role="group" aria-label="Filter projects by role" className="flex flex-wrap gap-2">
            {model.roles.switchOptions
              .filter((id) => id === 'all' || (roleCounts.get(id) ?? 0) > 0)
              .map((id) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={filters.role === id}
                  onClick={() => setFilters({ role: id })}
                  className="pill"
                >
                  {id === 'all' ? t('role.all') : model.roles.title(id)}
                  <span className="tabular-nums opacity-80">
                    {id === 'all' ? projects.length : roleCounts.get(id)}
                  </span>
                </button>
              ))}
          </div>
        )}

        <div
          className={`${model.roles.list.length > 0 ? 'mt-4' : ''} grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end`}
        >
          <div>
            <label htmlFor="project-search" className="mono-label mb-1.5 block">
              {t('projects.search')}
            </label>
            <div className="relative">
              <Search
                aria-hidden="true"
                className="text-subtle pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
              />
              <input
                id="project-search"
                type="search"
                value={filters.search}
                onChange={(event) => setFilters({ search: event.target.value })}
                placeholder={t('projects.searchHint')}
                className="field pl-9"
              />
            </div>
          </div>
          <div>
            <label htmlFor="tech-filter" className="mono-label mb-1.5 block">
              {t('projects.technology')}
            </label>
            <select
              id="tech-filter"
              value={filters.tech}
              onChange={(event) => setFilters({ tech: event.target.value })}
              className="field"
            >
              <option value="all">{t('projects.allTech')}</option>
              {technologies.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="year-filter" className="mono-label mb-1.5 block">
              {t('projects.year')}
            </label>
            <select
              id="year-filter"
              value={filters.year}
              onChange={(event) => setFilters({ year: event.target.value })}
              className="field"
            >
              <option value="all">{t('projects.allYears')}</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="order-filter" className="mono-label mb-1.5 block">
              {t('projects.order')}
            </label>
            <select
              id="order-filter"
              value={filters.order}
              onChange={(event) => setFilters({ order: event.target.value as ProjectOrder })}
              className="field"
            >
              {orders.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.label}
                </option>
              ))}
            </select>
          </div>
          <label className="text-ink flex min-h-11 cursor-pointer items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={filters.featuredOnly}
              onChange={(event) => setFilters({ featuredOnly: event.target.checked })}
              className="border-control h-4 w-4 rounded accent-[var(--color-accent)]"
            />
            {t('projects.featuredOnly')}
          </label>
        </div>

        <div className="border-line bg-surface mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3">
          {queryBar ? (
            <pre
              className="min-w-0 flex-1 overflow-x-auto font-mono text-[13px] leading-6"
              aria-label={`Query: ${query.text}`}
            >
              <code>
                {query.tokens.map((token, i) => (
                  <span
                    key={i}
                    className={
                      token.type === 'keyword'
                        ? 'text-accent-ink font-semibold'
                        : token.type === 'string'
                          ? 'json-string'
                          : token.type === 'number'
                            ? 'json-num'
                            : 'text-body'
                    }
                  >
                    {token.text}
                  </span>
                ))}
              </code>
            </pre>
          ) : (
            <span className="text-muted text-sm">{t('projects.filterHint')}</span>
          )}
          <p className="text-muted flex shrink-0 items-center gap-3 text-sm" aria-live="polite">
            <span className="font-mono tabular-nums">
              {visible.length} of {projects.length}{' '}
              {visible.length === 1 && projects.length === 1 ? 'row' : 'rows'}
            </span>
            {filtering && (
              <button
                type="button"
                onClick={() => setFilters({ ...DEFAULT_FILTERS })}
                className="text-accent-ink font-medium hover:underline"
              >
                {t('projects.clear')}
              </button>
            )}
          </p>
        </div>
      </div>

      {visible.length === 0 && (
        <div className="card mt-6 p-12 text-center">
          <p className="text-ink font-medium">{t('projects.none')}</p>
          <button
            type="button"
            onClick={() => setFilters({ ...DEFAULT_FILTERS })}
            className="btn-secondary mt-5"
          >
            {t('projects.clear')}
          </button>
        </div>
      )}

      {featured.length > 0 && (
        <ul className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          {featured.map((project) => (
            <FeaturedCard key={project.id} project={project} />
          ))}
        </ul>
      )}

      {others.length > 0 && (
        <div className={featured.length > 0 ? 'mt-14' : 'mt-6'}>
          <h3
            className={
              featured.length > 0 ? 'text-ink text-xl font-semibold tracking-tight' : 'sr-only'
            }
          >
            {featured.length > 0 ? t('projects.other') : 'All projects'}
          </h3>
          <ul
            className={`grid grid-cols-1 gap-6 md:grid-cols-2 ${featured.length > 0 ? 'mt-6' : ''}`}
          >
            {others.map((project) => (
              <CompactCard key={project.id} project={project} />
            ))}
          </ul>
        </div>
      )}
    </Section>
  );
}
