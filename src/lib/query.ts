// Project filtering and the SQL-style query line shown above the projects.
import type { RoleSet } from './roles';
import { tagKey } from './tags';
import type { Project, RoleId } from './types';

export type ProjectOrder = 'manual' | 'year-desc' | 'year-asc';

export interface ProjectFilters {
  role: RoleId;
  tech: string; // 'all' or a technology name
  year: string; // 'all' or a year
  search: string;
  featuredOnly: boolean;
  order: ProjectOrder;
}

export const DEFAULT_FILTERS: ProjectFilters = {
  role: 'all',
  tech: 'all',
  year: 'all',
  search: '',
  featuredOnly: false,
  order: 'manual',
};

export function isFiltering(filters: ProjectFilters): boolean {
  return (
    filters.role !== 'all' ||
    filters.tech !== 'all' ||
    filters.year !== 'all' ||
    filters.search.trim() !== '' ||
    filters.featuredOnly ||
    filters.order !== 'manual'
  );
}

export function filterProjects(
  projects: Project[],
  filters: ProjectFilters,
  roles: RoleSet
): Project[] {
  const needle = filters.search.trim().toLowerCase();
  const wantedTech = filters.tech === 'all' ? '' : tagKey(filters.tech);

  const matches = projects.filter((project) => {
    if (filters.role !== 'all' && !roles.projectRoles(project).includes(filters.role)) return false;
    if (wantedTech && !project.technologies.some((t) => tagKey(t) === wantedTech)) return false;
    if (filters.year !== 'all' && project.year !== filters.year) return false;
    if (filters.featuredOnly && !project.featured) return false;
    if (needle) {
      const haystack = [
        project.title,
        project.subtitle,
        project.description,
        ...project.technologies,
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });

  if (filters.order === 'manual') return matches;
  const direction = filters.order === 'year-desc' ? -1 : 1;
  // stable sort: equal years keep the order chosen in the admin panel
  return matches
    .map((project, position) => ({ project, position }))
    .sort(
      (a, b) =>
        direction * (Number(a.project.year ?? 0) - Number(b.project.year ?? 0)) ||
        a.position - b.position
    )
    .map((entry) => entry.project);
}

export type QueryTokenType = 'keyword' | 'string' | 'number' | 'plain';
export interface QueryToken {
  type: QueryTokenType;
  text: string;
}

const quote = (value: string) => `'${value.replace(/'/g, "''")}'`;

// "SELECT * FROM projects WHERE track = 'machine-learning' AND tech = 'Python' ORDER BY year DESC;"
export function buildQuery(filters: ProjectFilters): { text: string; tokens: QueryToken[] } {
  const tokens: QueryToken[] = [];
  const add = (type: QueryTokenType, text: string) => tokens.push({ type, text });
  const space = () => add('plain', ' ');

  add('keyword', 'SELECT');
  space();
  add('plain', '*');
  space();
  add('keyword', 'FROM');
  space();
  add('plain', 'projects');

  const conditions: QueryToken[][] = [];
  const condition = (
    column: string,
    operator: string,
    value: string,
    kind: 'string' | 'number' | 'keyword'
  ) =>
    conditions.push([
      { type: 'plain', text: column },
      { type: 'plain', text: ' ' },
      { type: operator === 'ILIKE' ? 'keyword' : 'plain', text: operator },
      { type: 'plain', text: ' ' },
      { type: kind, text: value },
    ]);

  if (filters.role !== 'all') condition('track', '=', quote(filters.role), 'string');
  if (filters.tech !== 'all') condition('tech', '=', quote(filters.tech), 'string');
  if (filters.year !== 'all')
    condition(
      'year',
      '=',
      /^\d+$/.test(filters.year) ? filters.year : quote(filters.year),
      'number'
    );
  if (filters.search.trim())
    condition('title', 'ILIKE', quote(`%${filters.search.trim()}%`), 'string');
  if (filters.featuredOnly) condition('featured', '=', 'TRUE', 'keyword');

  conditions.forEach((parts, i) => {
    space();
    add('keyword', i === 0 ? 'WHERE' : 'AND');
    space();
    tokens.push(...parts);
  });

  if (filters.order !== 'manual') {
    space();
    add('keyword', 'ORDER BY');
    space();
    add('plain', 'year');
    space();
    add('keyword', filters.order === 'year-desc' ? 'DESC' : 'ASC');
  }
  add('plain', ';');

  return { text: tokens.map((t) => t.text).join(''), tokens };
}
