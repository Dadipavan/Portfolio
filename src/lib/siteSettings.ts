// Metadata about the options in Admin > Appearance / Site settings, and the logic that merges stored
// settings with the defaults, so a missing or partial record is always safe to use.
import { SITE_SETTINGS } from './data';
import { mergeCopy } from './copy';
import { mergeRoles } from './roles';
import { toWebUrl } from './url';
import type {
  AccentId,
  FeatureId,
  LayoutId,
  SectionId,
  SiteSettings,
  ThemeMode,
  TimelineEdits,
  WidgetId,
} from './types';

// Every section the page can show, in the order the admin sees them
export const SECTION_IDS: SectionId[] = [
  'about',
  'insights',
  'projects',
  'skills',
  'timeline',
  'experience',
  'education',
  'certifications',
  'achievements',
  'recommendations',
  'work',
  'contact',
];

// What the section manager says about each section (the section itself is only shown when it has content)
export const SECTION_NOTES: Record<SectionId, string> = {
  about: 'Your about text, quick facts and current focus.',
  insights: 'Charts drawn from your projects and skills (needs at least one project).',
  projects: 'Your projects (needs at least one project).',
  skills: 'Skills by category (needs at least one skill category).',
  timeline:
    'Education, experience, certificates and projects on one timeline (needs at least three entries).',
  experience: 'Experience and leadership (needs at least one entry).',
  education: 'Education (needs at least one entry).',
  certifications: 'Certifications (needs at least one certification or extra line).',
  achievements: 'Achievements (needs at least one).',
  recommendations: 'The recommendations wall (needs at least one recommendation).',
  work: 'The Work with me panel (switch it on in Appearance and Site settings).',
  contact: 'Contact details and the message form.',
};

// A look (template) of the site: what it is called, how it behaves and who it suits.
export interface LayoutInfo {
  id: LayoutId;
  name: string;
  description: string;
  defaultTheme: 'light' | 'dark';
  // there is a place for the profile photo (the other looks work without one)
  photo: boolean;
  // the look has its own colour scheme, so the accent colour chosen in Appearance does not apply to it
  ownColours: boolean;
  // how a visitor moves around the page
  menu: string;
  // the lettering, in plain words
  typeface: string;
  // who it suits
  bestFor: string;
}

export const LAYOUTS: LayoutInfo[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'Analytics-style: number tiles, charts and a query bar up front.',
    defaultTheme: 'light',
    photo: false,
    ownColours: false,
    menu: 'Top bar',
    typeface: 'Clean sans-serif with a data-style monospace',
    bestFor: 'Data analysts and BI roles: the numbers come first.',
  },
  {
    id: 'bento',
    name: 'Bento',
    description: 'A grid of tiles: intro, role switch, key numbers and a technology map.',
    defaultTheme: 'light',
    photo: false,
    ownColours: false,
    menu: 'Floating top bar',
    typeface: 'Clean sans-serif with a data-style monospace',
    bestFor: 'People with several strengths to show side by side, at a glance.',
  },
  {
    id: 'lab',
    name: 'Data Lab',
    description: 'Dark, glowing glass cards with an animated data backdrop.',
    defaultTheme: 'dark',
    photo: false,
    ownColours: false,
    menu: 'Glass top bar',
    typeface: 'Clean sans-serif with a data-style monospace',
    bestFor: 'Data scientists and ML engineers who want a dark, technical feel.',
  },
  {
    id: 'split',
    name: 'Split profile',
    description: 'Your profile and menu stay fixed on the left while the content scrolls.',
    defaultTheme: 'light',
    photo: true,
    ownColours: false,
    menu: 'Fixed profile panel on the left',
    typeface: 'Clean sans-serif with a data-style monospace',
    bestFor: 'Anyone with many sections: the menu is always in view.',
  },
  {
    id: 'story',
    name: 'Data story',
    description: 'A guided scroll from raw data to a deployed model.',
    defaultTheme: 'light',
    photo: false,
    ownColours: false,
    menu: 'Top bar with a chapter stepper',
    typeface: 'Clean sans-serif with a data-style monospace',
    bestFor: 'Students and career changers: it tells the journey from raw data to a working model.',
  },
  {
    id: 'portrait',
    name: 'Portrait',
    description:
      'A warm, photo-led introduction: a large portrait beside your name, cream colours and a soft serif for headlines.',
    defaultTheme: 'light',
    photo: true,
    ownColours: true,
    menu: 'Top bar',
    typeface: 'Soft serif headlines (Fraunces) with a clean sans-serif for text',
    bestFor: 'Freelancers, consultants and job seekers who want to be remembered by a face.',
  },
  {
    id: 'editorial',
    name: 'Editorial',
    description:
      'A magazine front page: a ruled masthead, serif headlines, columns and a standfirst.',
    defaultTheme: 'light',
    photo: true,
    ownColours: true,
    menu: 'Centred masthead with the links underneath',
    typeface: 'Newsreader serif throughout',
    bestFor: 'Writers, researchers and anyone whose written case studies are the main attraction.',
  },
  {
    id: 'terminal',
    name: 'Terminal',
    description:
      "A developer's command line: monospace type, window panels and prompt-style headings.",
    defaultTheme: 'dark',
    photo: false,
    ownColours: true,
    menu: 'Tab strip, like a code editor',
    typeface: 'Monospace throughout (JetBrains Mono)',
    bestFor:
      'Data engineers, backend and DevOps profiles who want a code-first feel. It has no photo layout.',
  },
  {
    id: 'classic',
    name: 'Classic',
    description:
      'A traditional CV online: one centred column, small-caps headings, fine rules, navy and cream.',
    defaultTheme: 'light',
    photo: true,
    ownColours: true,
    menu: 'Centred masthead with a fine rule',
    typeface: 'Libre Baskerville serif',
    bestFor: 'Formal applications: finance, consulting, academia and the public sector.',
  },
  {
    id: 'spotlight',
    name: 'Spotlight',
    description:
      'A dark stage: a huge name, a glowing spotlight behind your photo and very large numbers.',
    defaultTheme: 'dark',
    photo: true,
    ownColours: true,
    menu: 'Top bar, plus dots on the right edge',
    typeface: 'Space Grotesk (a geometric sans-serif)',
    bestFor: 'A confident first impression: speakers, founders, product and design-minded roles.',
  },
  {
    id: 'aurora',
    name: 'Aurora',
    description:
      'Soft gradient light, frosted panels, round shapes and a floating menu dock at the bottom of the screen.',
    defaultTheme: 'light',
    photo: true,
    ownColours: true,
    menu: 'Floating dock at the bottom',
    typeface: 'Outfit (a friendly rounded sans-serif)',
    bestFor:
      'A modern, friendly look for product, UX and generalist profiles. Feels like an app on phones.',
  },
  {
    id: 'brutal',
    name: 'Brutalist',
    description:
      'Thick outlines, hard shadows and loud colour blocks. Impossible to mistake for anyone else.',
    defaultTheme: 'light',
    photo: true,
    ownColours: true,
    menu: 'Chunky top bar',
    typeface: 'Bricolage Grotesque, set heavy',
    bestFor: 'Creative and indie profiles who want to stand out. It is deliberately bold.',
  },
  {
    id: 'notebook',
    name: 'Notebook',
    description:
      'A paper notebook: ruled pages, handwritten notes, a taped photo and sticky-note numbers.',
    defaultTheme: 'light',
    photo: true,
    ownColours: true,
    menu: 'Top bar styled as notebook tabs',
    typeface: 'Lora serif with a handwriting accent (Caveat)',
    bestFor: 'Students and early-career people: a personal, human touch.',
  },
];

export const THEME_MODES: { id: ThemeMode; label: string; description: string }[] = [
  {
    id: 'layout',
    label: 'Match the look',
    description: 'Each look uses the theme it was designed for.',
  },
  { id: 'light', label: 'Always light', description: 'Light for everyone.' },
  { id: 'dark', label: 'Always dark', description: 'Dark for everyone.' },
  {
    id: 'system',
    label: "Follow the visitor's device",
    description: 'Light or dark, whichever their device uses.',
  },
];

export const ACCENTS: { id: AccentId; label: string; swatch: string }[] = [
  { id: 'blue', label: 'Blue', swatch: '#1d4ed8' },
  { id: 'teal', label: 'Teal', swatch: '#0f766e' },
  { id: 'violet', label: 'Violet', swatch: '#6d28d9' },
  { id: 'amber', label: 'Amber', swatch: '#b45309' },
];

export const WIDGETS: { id: WidgetId; label: string; description: string }[] = [
  {
    id: 'kpis',
    label: 'Number tiles',
    description: 'Key numbers that count up (projects, technologies, certifications, CGPA).',
  },
  {
    id: 'radar',
    label: 'Skills radar',
    description: 'Skills and projects across your roles (set up in Admin > Roles).',
  },
  {
    id: 'perYear',
    label: 'Projects per year',
    description: 'A bar chart of what you built each year.',
  },
  {
    id: 'techMap',
    label: 'Technology map',
    description: 'Bubbles sized by how many projects use each technology.',
  },
  {
    id: 'heatmap',
    label: 'Skills heatmap',
    description: 'Which technology is used in which project.',
  },
];

export type FeatureGroup =
  | 'Interactive tools'
  | 'Data-enthusiast style'
  | 'Proof and hiring'
  | 'Insights';

export const FEATURES: {
  id: FeatureId;
  label: string;
  description: string;
  group: FeatureGroup;
}[] = [
  {
    id: 'roleSwitch',
    label: 'View-as role switch',
    description:
      'Visitors choose Data Scientist, Engineer, Analyst or ML Engineer and the site adapts.',
    group: 'Interactive tools',
  },
  {
    id: 'quickView',
    label: '30-second summary',
    description: 'A one-screen recruiter summary.',
    group: 'Interactive tools',
  },
  {
    id: 'explorer',
    label: 'Skill and tag explorer',
    description: 'Click any skill to see every project, certificate and course behind it.',
    group: 'Interactive tools',
  },
  {
    id: 'searchPalette',
    label: 'Search (Ctrl K)',
    description: 'Jump to any section, project or link.',
    group: 'Interactive tools',
  },
  {
    id: 'heroChart',
    label: 'Hero chart',
    description: 'A live technology constellation drawn from your projects.',
    group: 'Data-enthusiast style',
  },
  {
    id: 'countUp',
    label: 'Counting numbers',
    description: 'Number tiles count up when they appear.',
    group: 'Data-enthusiast style',
  },
  {
    id: 'queryBar',
    label: 'Query bar on Projects',
    description:
      'Filters are written as a query, for example SELECT * FROM projects WHERE track = ...',
    group: 'Data-enthusiast style',
  },
  {
    id: 'charts',
    label: 'Charts from your data',
    description: 'Radar, projects per year, technology map and skills heatmap.',
    group: 'Data-enthusiast style',
  },
  {
    id: 'dataDownloads',
    label: 'Download my data / View as JSON',
    description: 'CSV and JSON downloads and a raw JSON viewer.',
    group: 'Data-enthusiast style',
  },
  {
    id: 'pipelineMotif',
    label: 'Pipeline look',
    description:
      'The role cards are drawn as a data pipeline: each role shows the stage you give it, such as collect, analyse, model, deploy.',
    group: 'Data-enthusiast style',
  },
  {
    id: 'timeline',
    label: 'Career timeline',
    description: 'Education, experience, certifications and projects on one timeline.',
    group: 'Proof and hiring',
  },
  {
    id: 'demoPreviews',
    label: 'Live demo previews',
    description: 'Show a running app inside the project card (when you enable it per project).',
    group: 'Proof and hiring',
  },
  {
    id: 'caseStudies',
    label: 'Case-study drawers',
    description: 'A detail view for each project.',
    group: 'Proof and hiring',
  },
  {
    id: 'workWithMe',
    label: 'Work with me panel',
    description: 'Availability, roles you want and a way to book a call.',
    group: 'Proof and hiring',
  },
  {
    id: 'shareTools',
    label: 'Share and save tools',
    description: 'QR code, copy link and save-my-contact.',
    group: 'Proof and hiring',
  },
  {
    id: 'recommendations',
    label: 'Recommendations wall',
    description: 'Shown only when you have added at least one.',
    group: 'Proof and hiring',
  },
  {
    id: 'insights',
    label: 'Visitor insights',
    description: 'Counts views and clicks (no personal data) for Admin > Insights.',
    group: 'Insights',
  },
];

// One switch in the admin turns all of these on or off together.
export const DATA_STYLE_FEATURES: FeatureId[] = FEATURES.filter(
  (f) => f.group === 'Data-enthusiast style'
).map((f) => f.id);

const LAYOUT_IDS = LAYOUTS.map((l) => l.id);
const THEME_IDS = THEME_MODES.map((t) => t.id);
const ACCENT_IDS = ACCENTS.map((a) => a.id);
const WIDGET_IDS = WIDGETS.map((w) => w.id);
const FEATURE_IDS = FEATURES.map((f) => f.id);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const text = (value: unknown, fallback: string) => (typeof value === 'string' ? value : fallback);
const bool = (value: unknown, fallback: boolean) => (typeof value === 'boolean' ? value : fallback);
const oneOf = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T =>
  typeof value === 'string' && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;

const sectionList = (value: unknown): SectionId[] =>
  Array.isArray(value)
    ? Array.from(
        new Set(value.filter((id): id is SectionId => SECTION_IDS.includes(id as SectionId)))
      )
    : [];

// The first version of the site stored only seven intro lines; they are now ordinary text entries
function legacyIntros(value: unknown): Record<string, string> {
  if (!isRecord(value)) return {};
  const out: Record<string, string> = {};
  Object.entries(value).forEach(([key, text]) => {
    if (typeof text === 'string') out[`section.${key}.intro`] = text;
  });
  return out;
}

// The timeline choices, checked so that nothing saved by hand can break the page
export function mergeTimelineEdits(value: unknown): TimelineEdits {
  const stored = isRecord(value) ? value : {};
  const year = (v: unknown) =>
    typeof v === 'number' && Number.isInteger(v) && v >= 1950 && v <= 2100 ? v : undefined;
  const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

  const hidden = Array.isArray(stored.hidden)
    ? Array.from(new Set(stored.hidden.filter((id): id is string => typeof id === 'string'))).slice(
        0,
        500
      )
    : [];

  const overrides: TimelineEdits['overrides'] = {};
  if (isRecord(stored.overrides)) {
    Object.entries(stored.overrides)
      .slice(0, 500)
      .forEach(([id, raw]) => {
        if (!isRecord(raw)) return;
        const change: TimelineEdits['overrides'][string] = {};
        const title = str(raw.title, 140);
        const subtitle = str(raw.subtitle, 200);
        const y = year(raw.year);
        if (title) change.title = title;
        if (subtitle) change.subtitle = subtitle;
        if (y) change.year = y;
        if (Object.keys(change).length) overrides[id] = change;
      });
  }

  const seen = new Set<string>();
  const custom: TimelineEdits['custom'] = [];
  if (Array.isArray(stored.custom)) {
    stored.custom.slice(0, 50).forEach((raw, index) => {
      if (!isRecord(raw)) return;
      const y = year(raw.year);
      const title = str(raw.title, 140);
      if (!y || !title) return;
      let id = str(raw.id, 40).replace(/[^a-z0-9-]/gi, '') || `m${index}`;
      while (seen.has(id)) id += 'x';
      seen.add(id);
      custom.push({ id, year: y, title, subtitle: str(raw.subtitle, 200), url: toWebUrl(raw.url) });
    });
  }

  return { hidden, overrides, custom };
}

export function mergeSiteSettings(value: unknown): SiteSettings {
  const d = SITE_SETTINGS;
  const stored = isRecord(value) ? value : {};
  const availability = isRecord(stored.availability) ? stored.availability : {};
  const appearance = isRecord(stored.appearance) ? stored.appearance : {};
  const features = isRecord(stored.features) ? stored.features : {};
  const sections = isRecord(stored.sections) ? stored.sections : {};
  const work = isRecord(stored.workWithMe) ? stored.workWithMe : {};

  const widgets = Array.isArray(appearance.widgets)
    ? Array.from(
        new Set(appearance.widgets.filter((w): w is WidgetId => WIDGET_IDS.includes(w as WidgetId)))
      )
    : d.appearance.widgets;

  return {
    kicker: text(stored.kicker, d.kicker).slice(0, 40),
    availability: {
      enabled: bool(availability.enabled, d.availability.enabled),
      text: text(availability.text, d.availability.text),
    },
    copy: mergeCopy({
      ...legacyIntros(stored.intros),
      ...(isRecord(stored.copy) ? stored.copy : {}),
    }),
    additionalCertifications: Array.isArray(stored.additionalCertifications)
      ? stored.additionalCertifications.filter(
          (item): item is string => typeof item === 'string' && item.trim() !== ''
        )
      : d.additionalCertifications,
    timelineEdits: mergeTimelineEdits(stored.timelineEdits),
    contactTopics: Array.isArray(stored.contactTopics)
      ? Array.from(
          new Set(
            stored.contactTopics
              .filter((item): item is string => typeof item === 'string')
              .map((item) => item.trim().slice(0, 60))
              .filter(Boolean)
          )
        ).slice(0, 10)
      : d.contactTopics,
    appearance: {
      layout: oneOf(appearance.layout, LAYOUT_IDS, d.appearance.layout),
      theme: oneOf(appearance.theme, THEME_IDS, d.appearance.theme),
      allowVisitorTheme: bool(appearance.allowVisitorTheme, d.appearance.allowVisitorTheme),
      accent: oneOf(appearance.accent, ACCENT_IDS, d.appearance.accent),
      animations: bool(appearance.animations, d.appearance.animations),
      widgets,
    },
    features: Object.fromEntries(
      FEATURE_IDS.map((id) => [id, bool(features[id], d.features[id])])
    ) as SiteSettings['features'],
    roles: mergeRoles(stored.roles, stored.roleViews),
    sections: {
      order: sectionList(sections.order),
      hidden: sectionList(sections.hidden),
    },
    workWithMe: {
      enabled: bool(work.enabled, d.workWithMe.enabled),
      roles: Array.isArray(work.roles)
        ? work.roles
            .filter((r): r is string => typeof r === 'string' && r.trim() !== '')
            .slice(0, 12)
        : d.workWithMe.roles,
      location: text(work.location, d.workWithMe.location),
      remote: text(work.remote, d.workWithMe.remote),
      startDate: text(work.startDate, d.workWithMe.startDate),
      contact: text(work.contact, d.workWithMe.contact),
      bookingUrl: toWebUrl(text(work.bookingUrl, d.workWithMe.bookingUrl)),
      note: text(work.note, d.workWithMe.note),
    },
    highlights: Array.isArray(stored.highlights)
      ? stored.highlights
          .filter(
            (h): h is { label: string; value: string } =>
              isRecord(h) && typeof h.label === 'string' && typeof h.value === 'string'
          )
          .map((h) => ({ label: h.label.trim().slice(0, 40), value: h.value.trim().slice(0, 24) }))
          .filter((h) => h.label && h.value)
          .slice(0, 8)
      : d.highlights,
  };
}
