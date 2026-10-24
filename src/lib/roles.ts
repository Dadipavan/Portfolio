// Roles: the career directions the site is organised around (Data Scientist, Data Engineer, ...).
// They are stored in the site settings, so the admin can rename, add, remove and reorder them, and
// everything that uses them (the "View as" switch, role cards, charts, filters, colours) follows.
import type {
  PaletteId,
  Project,
  PublicResume,
  RoleDef,
  RoleIconId,
  RoleId,
  SkillCategory,
} from './types';

export const PALETTES: { id: PaletteId; label: string; swatch: string }[] = [
  { id: 'blue', label: 'Blue', swatch: '#2563eb' },
  { id: 'teal', label: 'Teal', swatch: '#0d9488' },
  { id: 'violet', label: 'Violet', swatch: '#7c3aed' },
  { id: 'amber', label: 'Amber', swatch: '#d97706' },
  { id: 'rose', label: 'Rose', swatch: '#e11d48' },
  { id: 'green', label: 'Green', swatch: '#16a34a' },
  { id: 'orange', label: 'Orange', swatch: '#ea580c' },
  { id: 'cyan', label: 'Cyan', swatch: '#0891b2' },
];

export const ROLE_ICON_OPTIONS: { id: RoleIconId; label: string }[] = [
  { id: 'database', label: 'Database' },
  { id: 'chart', label: 'Chart' },
  { id: 'flask', label: 'Flask' },
  { id: 'cpu', label: 'Chip' },
  { id: 'brain', label: 'Brain' },
  { id: 'code', label: 'Code' },
  { id: 'cloud', label: 'Cloud' },
  { id: 'layers', label: 'Layers' },
  { id: 'target', label: 'Target' },
  { id: 'sparkles', label: 'Sparkles' },
];

const PALETTE_IDS = PALETTES.map((p) => p.id);
const ICON_IDS = ROLE_ICON_OPTIONS.map((i) => i.id);

export const MAX_ROLES = 8;

// The four roles the site starts with. Edit the keyword lists to change how projects and skills are
// matched to a role (or tag projects by hand in Admin > Projects).
export const DEFAULT_ROLES: RoleDef[] = [
  {
    id: 'data-engineering',
    label: 'Data Engineering',
    title: 'Data Engineer',
    blurb: 'Collecting, storing and preparing data',
    stage: 'Collect & clean',
    palette: 'teal',
    icon: 'database',
    keywords: [
      'sql',
      'mysql',
      'postgres',
      'nosql',
      'etl',
      'pipeline',
      'airflow',
      'spark',
      'hadoop',
      'kafka',
      'warehouse',
      'database',
      'data management',
      'data collection',
      'data cleaning',
      'supabase',
      'cloud',
      'oci',
      'pdfminer',
      'yfinance',
      'scraping',
      'api',
    ],
    skillKeywords: ['python', 'linux', 'unix', 'shell', 'bash', 'git', 'docker'],
    headline: '',
    summary: '',
    resumeId: '',
    priority: 0,
  },
  {
    id: 'data-analytics',
    label: 'Data Analytics',
    title: 'Data Analyst',
    blurb: 'Exploring data and communicating insights',
    stage: 'Analyse',
    palette: 'amber',
    icon: 'chart',
    keywords: [
      'power bi',
      'tableau',
      'dax',
      'dashboard',
      'visualization',
      'visualisation',
      'excel',
      'plotly',
      'streamlit',
      'eda',
      'data analysis',
      'reporting',
      'insight',
      'data modeling',
      'sql',
      'pandas',
      'matplotlib',
      'seaborn',
      'statistic',
    ],
    skillKeywords: ['python', 'numpy'],
    headline: '',
    summary: '',
    resumeId: '',
    priority: 1,
  },
  {
    id: 'data-science',
    label: 'Data Science',
    title: 'Data Scientist',
    blurb: 'Statistics and models that answer questions',
    stage: 'Model',
    palette: 'blue',
    icon: 'flask',
    keywords: [
      'python',
      'pandas',
      'numpy',
      'scikit-learn',
      'sklearn',
      'statistic',
      'predictive',
      'hypothesis',
      'regression',
      'random forest',
      'feature engineering',
      'time series',
      'forecasting',
      'clustering',
      'eda',
      'matplotlib',
      'seaborn',
      'tf-idf',
      'cosine similarity',
      'data science',
      'jupyter',
    ],
    skillKeywords: ['data visualization'],
    headline: '',
    summary: '',
    resumeId: '',
    priority: 3,
  },
  {
    id: 'machine-learning',
    label: 'ML Engineering',
    title: 'ML Engineer',
    blurb: 'Training and shipping machine learning systems',
    stage: 'Deploy',
    palette: 'violet',
    icon: 'cpu',
    keywords: [
      'machine learning',
      'deep learning',
      'tensorflow',
      'keras',
      'pytorch',
      'lstm',
      'neural',
      'nlp',
      'bert',
      'spacy',
      'scikit-learn',
      'model',
      'flask',
      'deploy',
      'inference',
      'generative',
      'ai',
      'transformer',
      'classification',
      'classifier',
      'embedding',
      'random forest',
    ],
    skillKeywords: ['python', 'numpy', 'pandas'],
    headline: '',
    summary: '',
    resumeId: '',
    priority: 2,
  },
];

// A short, safe id made from a name ("Cloud Engineer" -> "cloud-engineer")
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const words = (value: unknown, limit = 60): string[] =>
  Array.isArray(value)
    ? Array.from(
        new Set(
          value
            .filter((w): w is string => typeof w === 'string')
            .map((w) => w.trim().toLowerCase())
            .filter(Boolean)
        )
      ).slice(0, limit)
    : [];

// Turns whatever is stored into a safe list of roles. Nothing stored gives the four default roles; a list
// that is stored is used as it is (an empty list on purpose switches the role features off).
export function mergeRoles(value: unknown, legacyViews?: unknown): RoleDef[] {
  if (!Array.isArray(value)) {
    // older records only stored a headline, summary and resume for each of the four default roles
    const views = isRecord(legacyViews) ? legacyViews : {};
    return DEFAULT_ROLES.map((role) => {
      const view = isRecord(views[role.id]) ? (views[role.id] as Record<string, unknown>) : {};
      return {
        ...role,
        headline:
          typeof view.headline === 'string' ? view.headline.trim().slice(0, 140) : role.headline,
        summary:
          typeof view.summary === 'string' ? view.summary.trim().slice(0, 400) : role.summary,
        resumeId: typeof view.resumeId === 'string' ? view.resumeId : role.resumeId,
      };
    });
  }

  const seen = new Set<string>();
  const roles: RoleDef[] = [];
  value.forEach((raw, index) => {
    if (!isRecord(raw) || roles.length >= MAX_ROLES) return;
    const label = typeof raw.label === 'string' ? raw.label.trim().slice(0, 40) : '';
    const id = slugify(typeof raw.id === 'string' && raw.id ? raw.id : label);
    if (!label || !id || id === 'all' || id === 'none' || seen.has(id)) return;
    seen.add(id);
    const fallback = DEFAULT_ROLES.find((r) => r.id === id);
    const text = (key: string, max: number, alt = '') =>
      typeof raw[key] === 'string' ? (raw[key] as string).trim().slice(0, max) : alt;
    roles.push({
      id,
      label,
      title: text('title', 40, label) || label,
      blurb: text('blurb', 120, fallback?.blurb ?? ''),
      stage: text('stage', 30, fallback?.stage ?? ''),
      palette: PALETTE_IDS.includes(raw.palette as PaletteId)
        ? (raw.palette as PaletteId)
        : PALETTE_IDS[index % PALETTE_IDS.length],
      icon: ICON_IDS.includes(raw.icon as RoleIconId) ? (raw.icon as RoleIconId) : 'layers',
      keywords: words(raw.keywords),
      skillKeywords: words(raw.skillKeywords),
      headline: text('headline', 140),
      summary: text('summary', 400),
      resumeId: text('resumeId', 80),
      priority:
        typeof raw.priority === 'number' && Number.isFinite(raw.priority)
          ? raw.priority
          : fallback?.priority,
    });
  });
  return roles;
}

// Whole-word match for short keywords (so "ai" or "sql" never match inside other words)
function matches(text: string, keyword: string): boolean {
  const haystack = text.toLowerCase();
  if (keyword.length <= 3) {
    return new RegExp(
      `(^|[^a-z0-9])${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^a-z0-9])`
    ).test(haystack);
  }
  return haystack.includes(keyword);
}

export class RoleSet {
  readonly list: RoleDef[];
  private readonly byId: Map<string, RoleDef>;
  private readonly rank: Map<string, number>;

  constructor(list: RoleDef[]) {
    this.list = list;
    this.byId = new Map(list.map((role) => [role.id, role]));
    this.rank = new Map(list.map((role, index) => [role.id, role.priority ?? index]));
  }

  get ids(): string[] {
    return this.list.map((role) => role.id);
  }

  get isEmpty(): boolean {
    return this.list.length === 0;
  }

  has(id: string): boolean {
    return this.byId.has(id);
  }

  get(id: string): RoleDef | undefined {
    return this.byId.get(id);
  }

  // "all" or the id of a role that exists
  isRole(value: unknown): value is RoleId {
    return typeof value === 'string' && (value === 'all' || this.byId.has(value));
  }

  // The discipline ("Data Engineering")
  label(id: string): string {
    return this.byId.get(id)?.label ?? '';
  }

  // The job title ("Data Engineer")
  title(id: string): string {
    const role = this.byId.get(id);
    return role ? role.title || role.label : '';
  }

  // The colour family used for chips, charts and covers; "none" for anything without a role
  palette(id: string | undefined): PaletteId | 'none' {
    return (id && this.byId.get(id)?.palette) || 'none';
  }

  // Higher wins when several roles match equally
  priorityOf(id: string): number {
    return this.rank.get(id) ?? -1;
  }

  skillMatches(skill: string, id: string): boolean {
    const role = this.byId.get(id);
    return role ? [...role.keywords, ...role.skillKeywords].some((k) => matches(skill, k)) : false;
  }

  // The roles chosen for a project in the admin win. Otherwise a project belongs to at most the two
  // roles with the most matching technologies, and to none when nothing matches.
  projectRoles(project: Project): string[] {
    if (project.tracks && project.tracks.length > 0) {
      const chosen = project.tracks.filter((id) => this.byId.has(id));
      if (chosen.length > 0) return chosen;
    }

    const technologies = [...(project.technologies || []), project.subtitle || ''];
    const scored = this.list
      .map((role) => ({
        id: role.id,
        score: technologies.filter((tech) => tech && role.keywords.some((k) => matches(tech, k)))
          .length,
      }))
      .filter((entry) => entry.score > 0);

    scored.sort((a, b) => b.score - a.score || this.priorityOf(b.id) - this.priorityOf(a.id));
    return scored.slice(0, 2).map((entry) => entry.id);
  }

  // The roles a technology belongs to by name alone (strong keywords only). One match means the
  // technology is specific to that role; several mean it is a general tool.
  strictRolesOf(tech: string): string[] {
    return this.list
      .filter((role) => role.keywords.some((k) => matches(tech, k)))
      .map((role) => role.id);
  }

  // The options of the "View as" switch
  get switchOptions(): RoleId[] {
    return ['all', ...this.ids];
  }
}

export interface RoleStat {
  id: string;
  label: string;
  title: string;
  blurb: string;
  stage: string;
  projectCount: number;
  // Technologies from the projects in this role (most distinctive first); when the role has no
  // projects yet, matching skills are used instead.
  highlights: string[];
  highlightsAreSkills: boolean;
}

export function buildRoleStats(
  projects: Project[],
  categories: SkillCategory[],
  roles: RoleSet
): RoleStat[] {
  const byRole = new Map<string, Project[]>();
  projects.forEach((project) =>
    roles
      .projectRoles(project)
      .forEach((id) => byRole.set(id, [...(byRole.get(id) ?? []), project]))
  );

  // In how many roles does each technology appear? Rarer ones describe a role better.
  const spread = new Map<string, number>();
  byRole.forEach((list) => {
    new Set(list.flatMap((p) => p.technologies)).forEach((tech) =>
      spread.set(tech, (spread.get(tech) ?? 0) + 1)
    );
  });

  return roles.list.map((role) => {
    const list = byRole.get(role.id) ?? [];
    const frequency = new Map<string, number>();
    list.forEach((p) =>
      p.technologies.forEach((tech) => frequency.set(tech, (frequency.get(tech) ?? 0) + 1))
    );

    let highlights = Array.from(frequency.keys())
      .sort(
        (a, b) =>
          (spread.get(a) ?? 0) - (spread.get(b) ?? 0) ||
          (frequency.get(b) ?? 0) - (frequency.get(a) ?? 0)
      )
      .slice(0, 3);

    let highlightsAreSkills = false;
    if (highlights.length === 0) {
      highlights = categories
        .flatMap((category) => category.skills)
        .filter((skill) => roles.skillMatches(skill, role.id))
        .slice(0, 3);
      highlightsAreSkills = highlights.length > 0;
    }

    return {
      id: role.id,
      label: role.label,
      title: role.title || role.label,
      blurb: role.blurb,
      stage: role.stage,
      projectCount: list.length,
      highlights,
      highlightsAreSkills,
    };
  });
}

// What "View as <role>" shows in the intro, or null when nothing special is set for it
export function resolveRoleView(
  role: RoleId,
  roles: RoleSet
): { headline: string; summary: string } | null {
  if (role === 'all') return null;
  const def = roles.get(role);
  if (!def || (!def.headline && !def.summary)) return null;
  return { headline: def.headline, summary: def.summary };
}

// The resume to offer for a role: the one chosen for the role in Admin > Roles, then a public resume
// tagged for the role, then a public resume with no role, then any public resume.
export function pickResume(
  role: RoleId,
  resumes: PublicResume[],
  roles: RoleSet
): PublicResume | undefined {
  if (resumes.length === 0) return undefined;
  if (role !== 'all') {
    const chosen = roles.get(role)?.resumeId;
    const byChoice = chosen ? resumes.find((r) => r.id === chosen) : undefined;
    if (byChoice) return byChoice;
    const byRole = resumes.find((r) => r.role === role);
    if (byRole) return byRole;
  }
  return resumes.find((r) => !r.role) ?? resumes[0];
}
