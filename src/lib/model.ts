// Everything the page derives from the content: which sections are shown, in what order, with which
// numbers, and the data behind the charts. Pure and deterministic, so the server, the browser and the
// admin live preview all agree.
import {
  COMPACT_CONSTELLATION,
  buildConstellation,
  buildHeatmap,
  buildKpis,
  buildRadarData,
  buildTechMap,
  buildYearData,
  type ConstellationData,
  type ConstellationOptions,
  type HeatmapData,
  type Kpi,
  type RadarAxis,
  type TechMapData,
  type YearDatum,
} from './charts';
import { makeTranslate, type Translate } from './copy';
import { buildRoleStats, RoleSet, type RoleStat } from './roles';
import { SECTION_IDS } from './siteSettings';
import { buildEvidenceIndex, tagKey, type EvidenceIndex } from './tags';
import { buildTimeline, type TimelineItem } from './timeline';
import type { LayoutId, PortfolioContent, SectionId } from './types';

export type { SectionId };

export interface SectionInfo {
  id: SectionId;
  label: string;
  number: string;
}

const DEFAULT_ORDER: SectionId[] = [
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

// The story look tells its tale in this order: who I am, how I learned, what I can do, what I built,
// where I applied it, and how to work together.
const STORY_ORDER: SectionId[] = [
  'about',
  'education',
  'certifications',
  'timeline',
  'skills',
  'insights',
  'projects',
  'experience',
  'achievements',
  'recommendations',
  'work',
  'contact',
];

// Each of the newer looks opens with the sections that suit the people it was designed for; the admin can still
// move any section (Admin > Appearance) and every order lists every section.
const CV_ORDER: SectionId[] = [
  'about',
  'experience',
  'education',
  'projects',
  'skills',
  'certifications',
  'achievements',
  'recommendations',
  'insights',
  'timeline',
  'work',
  'contact',
];

const MAGAZINE_ORDER: SectionId[] = [
  'about',
  'projects',
  'insights',
  'achievements',
  'experience',
  'education',
  'skills',
  'certifications',
  'timeline',
  'recommendations',
  'work',
  'contact',
];

const ENGINEER_ORDER: SectionId[] = [
  'about',
  'skills',
  'projects',
  'experience',
  'education',
  'certifications',
  'achievements',
  'insights',
  'timeline',
  'recommendations',
  'work',
  'contact',
];

const SHOWCASE_ORDER: SectionId[] = [
  'about',
  'projects',
  'achievements',
  'insights',
  'skills',
  'experience',
  'education',
  'certifications',
  'recommendations',
  'timeline',
  'work',
  'contact',
];

const STUDENT_ORDER: SectionId[] = [
  'about',
  'education',
  'projects',
  'skills',
  'certifications',
  'achievements',
  'experience',
  'timeline',
  'insights',
  'recommendations',
  'work',
  'contact',
];

export const SECTION_ORDER: Record<LayoutId, SectionId[]> = {
  dashboard: DEFAULT_ORDER,
  bento: DEFAULT_ORDER,
  lab: DEFAULT_ORDER,
  split: DEFAULT_ORDER,
  story: STORY_ORDER,
  portrait: SHOWCASE_ORDER,
  editorial: MAGAZINE_ORDER,
  terminal: ENGINEER_ORDER,
  classic: CV_ORDER,
  spotlight: SHOWCASE_ORDER,
  aurora: DEFAULT_ORDER,
  brutal: SHOWCASE_ORDER,
  notebook: STUDENT_ORDER,
};

// Shown in the top navigation; the rest are reached from the menu, the sidebar and search
const PRIMARY_NAV: SectionId[] = [
  'about',
  'insights',
  'projects',
  'skills',
  'experience',
  'education',
  'certifications',
  'contact',
];

// The constellation layout takes a few milliseconds, and the admin live preview rebuilds the model on every
// keystroke, so the same projects and roles reuse the picture they already have. The result is deterministic,
// which is what makes this safe.
const pictureCache = new Map<string, ConstellationData>();

function constellationFor(content: PortfolioContent, roles: RoleSet, options?: ConstellationOptions): ConstellationData {
  const key = JSON.stringify([
    content.projects.map((p) => [p.id, p.subtitle, p.technologies, p.tracks]),
    roles.list.map((r) => [r.id, r.keywords, r.priority]),
    options ?? null,
  ]);
  const known = pictureCache.get(key);
  if (known) return known;
  const built = buildConstellation(content.projects, roles, options);
  pictureCache.set(key, built);
  if (pictureCache.size > 12) pictureCache.delete(pictureCache.keys().next().value as string);
  return built;
}

export interface SiteModel {
  layout: LayoutId;
  sections: SectionInfo[];
  nav: SectionInfo[];
  roles: RoleSet;
  roleStats: RoleStat[];
  t: Translate;
  // tag key -> projects using it
  techUsage: Record<string, { name: string; count: number }>;
  evidence: EvidenceIndex;
  kpis: Kpi[];
  years: YearDatum[];
  radar: RadarAxis[];
  techMap: TechMapData;
  heatmap: HeatmapData;
  constellation: ConstellationData;
  // the same picture drawn tall with larger names, for phones
  constellationCompact: ConstellationData;
  timeline: TimelineItem[];
}

// The order the admin chose, with any section it does not mention added at the end in the usual order
export function chosenOrder(order: SectionId[], fallback: SectionId[]): SectionId[] {
  if (order.length === 0) return fallback;
  const listed = order.filter((id) => SECTION_IDS.includes(id));
  return [...listed, ...fallback.filter((id) => !listed.includes(id))];
}

export function buildSiteModel(content: PortfolioContent): SiteModel {
  const { siteSettings: settings } = content;
  const layout = settings.appearance.layout;
  const features = settings.features;
  const roles = new RoleSet(settings.roles);
  const t = makeTranslate(settings.copy);

  const timeline = buildTimeline(content);
  const chartWidgets = settings.appearance.widgets.filter((w) => w !== 'kpis');

  const shown: Record<SectionId, boolean> = {
    about: true,
    insights: features.charts && chartWidgets.length > 0 && content.projects.length > 0,
    projects: content.projects.length > 0,
    skills: content.technicalSkills.length > 0,
    timeline: features.timeline && timeline.length >= 3,
    experience: content.experience.length > 0,
    education: content.education.length > 0,
    certifications:
      content.certifications.length > 0 || settings.additionalCertifications.length > 0,
    achievements: content.achievements.length > 0,
    recommendations: features.recommendations && content.recommendations.length > 0,
    work: features.workWithMe && settings.workWithMe.enabled,
    contact: true,
  };

  // The data story tells its own tale, so only "hidden" applies there; the other looks follow the admin's order
  const order =
    layout === 'story'
      ? SECTION_ORDER.story
      : chosenOrder(settings.sections.order, SECTION_ORDER[layout]);
  const sections = order
    .filter((id) => shown[id] && !settings.sections.hidden.includes(id))
    .map((id, index) => ({
      id,
      label: t(`section.${id}.label`),
      number: String(index + 1).padStart(2, '0'),
    }));

  const techUsage: Record<string, { name: string; count: number }> = {};
  content.projects.forEach((project) =>
    new Set(project.technologies.map(tagKey)).forEach((key) => {
      const name = project.technologies.find((t) => tagKey(t) === key) ?? key;
      techUsage[key] = {
        name: techUsage[key]?.name ?? name,
        count: (techUsage[key]?.count ?? 0) + 1,
      };
    })
  );

  return {
    layout,
    sections,
    nav: sections.filter((s) => PRIMARY_NAV.includes(s.id)),
    roles,
    roleStats: buildRoleStats(content.projects, content.technicalSkills, roles),
    t,
    techUsage,
    evidence: buildEvidenceIndex(content),
    kpis: buildKpis(content),
    years: buildYearData(content.projects),
    radar: buildRadarData(content.projects, content.technicalSkills, roles),
    techMap: buildTechMap(content.projects, roles),
    heatmap: buildHeatmap(content.projects, roles),
    constellation: constellationFor(content, roles),
    constellationCompact: constellationFor(content, roles, COMPACT_CONSTELLATION),
    timeline,
  };
}
