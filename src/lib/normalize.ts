// Turns raw stored content (hand-edited JSON, older records, drafts from the admin preview) into the
// shape the site expects. Pure functions: used by the server loader and by the admin live preview.
import {
  ACHIEVEMENTS,
  CERTIFICATIONS,
  CURRENT_FOCUS,
  EDUCATION,
  EXPERIENCE,
  PERSONAL_INFO,
  PROJECTS,
  QUICK_FACTS,
  TECHNICAL_SKILLS,
} from './data';
import { mergeSiteSettings } from './siteSettings';
import { normaliseMedia, normaliseMediaList } from './media';
import { toWebUrl } from './url';
import type {
  Achievement,
  Certification,
  Education,
  Experience,
  FocusArea,
  Metric,
  AchievementCategory,
  CaseStudySection,
  PersonalInfo,
  PortfolioContent,
  ProfilePhoto,
  Project,
  PublicResume,
  Recommendation,
  ProfileLink,
  SkillCategory,
} from './types';

// A role id is a short slug such as "data-science"; ids of roles that no longer exist are ignored where they are used
const isRoleId = (value: unknown): value is string =>
  typeof value === 'string' && /^[a-z0-9][a-z0-9-]{0,39}$/.test(value);

const asArray = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);
const asText = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;
const asStrings = (value: unknown): string[] =>
  asArray<unknown>(value).filter(
    (item): item is string => typeof item === 'string' && item.trim() !== ''
  );
const isObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

export function normaliseSkills(value: unknown): SkillCategory[] {
  if (Array.isArray(value)) {
    return value
      .filter((c): c is SkillCategory => isObject(c))
      .map((c) => ({
        category: asText(c.category, 'Skills'),
        emoji: c.emoji,
        skills: asStrings(c.skills),
      }))
      .filter((c) => c.skills.length > 0);
  }

  // Original object format: { languages, machineLearning, webFrontend, toolsDb, softSkills }
  const legacy = isObject(value) ? value : {};
  return [
    { category: 'Programming Languages', skills: asStrings(legacy.languages) },
    { category: 'Machine Learning & AI', skills: asStrings(legacy.machineLearning) },
    { category: 'Web Frontend', skills: asStrings(legacy.webFrontend) },
    { category: 'Tools & Databases', skills: asStrings(legacy.toolsDb) },
    { category: 'Soft Skills', skills: asStrings(legacy.softSkills) },
  ].filter((c) => c.skills.length > 0);
}

// Long texts written in the admin (Markdown). Capped so one field can never fill the whole record.
const LONG_TEXT = 20000;
const asLong = (value: unknown): string => asText(value).slice(0, LONG_TEXT);

function normaliseSections(value: unknown): CaseStudySection[] {
  return asArray<unknown>(value)
    .filter((section): section is Record<string, unknown> => isObject(section))
    .map((section, index) => ({
      id: asText(section.id).slice(0, 40) || `section-${index + 1}`,
      title: asText(section.title).trim().slice(0, 100),
      body: asLong(section.body),
    }))
    .filter((section) => section.title || section.body)
    .slice(0, 12);
}

function asMetrics(value: unknown): Metric[] {
  return asArray<unknown>(value)
    .filter((m): m is Record<string, unknown> => isObject(m))
    .map((m) => ({ label: asText(m.label).trim(), value: asText(m.value).trim() }))
    .filter((m) => m.label && m.value);
}

export function normaliseProjects(value: unknown): Project[] {
  return asArray<Record<string, unknown>>(value)
    .filter((p) => isObject(p) && asText(p.title))
    .map((p, index) => {
      const teamSize = Number(p.teamSize);
      return {
        id: (p.id as string | number | undefined) ?? index,
        title: asText(p.title),
        subtitle: asText(p.subtitle),
        description: asText(p.description),
        technologies: asStrings(p.technologies),
        githubUrl: toWebUrl(p.githubUrl),
        liveUrl: toWebUrl(p.liveUrl),
        year: asText(p.year),
        featured: Boolean(p.featured),
        status: asText(p.status),
        tracks: asArray<unknown>(p.tracks).filter(isRoleId),
        problem: asLong(p.problem),
        approach: asLong(p.approach),
        keyFeatures: asStrings(p.keyFeatures),
        challenges: asLong(p.challenges),
        solutions: asLong(p.solutions),
        results: asLong(p.results),
        metrics: asMetrics(p.metrics),
        learnings: asLong(p.learnings),
        role: asText(p.role),
        teamSize: Number.isFinite(teamSize) && teamSize > 0 ? teamSize : undefined,
        startDate: asText(p.startDate),
        endDate: asText(p.endDate),
        images: asStrings(p.images).map(toWebUrl).filter(Boolean),
        embedLive: Boolean(p.embedLive),
        published: p.published !== false,
        category: asText(p.category).trim().slice(0, 60),
        tools: asStrings(p.tools).slice(0, 30),
        overview: asLong(p.overview),
        objectives: asLong(p.objectives),
        dataSources: asLong(p.dataSources),
        implementation: asLong(p.implementation),
        conclusions: asLong(p.conclusions),
        sections: normaliseSections(p.sections),
        media: normaliseMediaList(p.media),
      };
    });
}

export function normaliseExperience(value: unknown): Experience[] {
  return asArray<Record<string, unknown>>(value)
    .filter((e) => isObject(e) && asText(e.title))
    .map((e, index) => ({
      id: (e.id as string | number | undefined) ?? index,
      title: asText(e.title),
      company: asText(e.company),
      location: asText(e.location),
      period: asText(e.period),
      type: asText(e.type),
      description: typeof e.description === 'string' ? [e.description] : asStrings(e.description),
      logo: normaliseMedia(e.logo) ?? undefined,
      website: toWebUrl(e.website),
      summary: asText(e.summary).trim().slice(0, 400),
      skills: asStrings(e.skills).slice(0, 20),
    }));
}

export function normaliseEducation(value: unknown): Education[] {
  return asArray<Record<string, unknown>>(value)
    .filter((e) => isObject(e) && asText(e.institution))
    .map((e, index) => ({
      id: (e.id as string | number | undefined) ?? index,
      institution: asText(e.institution),
      degree: asText(e.degree),
      location: asText(e.location),
      period: asText(e.period),
      grade: asText(e.grade),
      coursework: asStrings(e.coursework),
    }));
}

export function normaliseCertifications(value: unknown): Certification[] {
  return asArray<Record<string, unknown>>(value)
    .filter((c) => isObject(c) && asText(c.title))
    .map((c) => ({
      id: c.id as string | number | undefined,
      title: asText(c.title),
      issuer: asText(c.issuer),
      year: asText(c.year),
      issueDate: asText(c.issueDate).trim().slice(0, 40),
      credentialId: asText(c.credentialId).trim().slice(0, 120),
      description: asText(c.description).slice(0, 2000),
      skills: asStrings(c.skills),
      verificationUrl: toWebUrl(c.verificationUrl),
      imageUrl: toWebUrl(c.imageUrl),
      file: normaliseMedia(c.file) ?? undefined,
      visible: c.visible !== false,
    }));
}

const ACHIEVEMENT_CATEGORIES: AchievementCategory[] = [
  'hackathon',
  'competition',
  'award',
  'research',
  'milestone',
  'recognition',
  'other',
];

export function normaliseAchievements(value: unknown): Achievement[] {
  return asArray<Record<string, unknown>>(value)
    .filter((a) => isObject(a) && asText(a.title))
    .map((a, index) => ({
      id: (a.id as string | number | undefined) ?? index,
      title: asText(a.title),
      description: asText(a.description),
      background: asLong(a.background),
      date: asText(a.date).trim().slice(0, 40),
      organization: asText(a.organization).trim().slice(0, 120),
      category: ACHIEVEMENT_CATEGORIES.includes(a.category as AchievementCategory)
        ? (a.category as AchievementCategory)
        : undefined,
      impact: asLong(a.impact),
      links: normaliseLinks(a.links),
      media: normaliseMediaList(a.media, 20),
      published: a.published !== false,
    }));
}

export function normaliseFocus(value: unknown): FocusArea[] {
  return asArray<Record<string, unknown>>(value)
    .filter((f) => isObject(f) && asText(f.title))
    .map((f) => ({
      title: asText(f.title),
      description: asText(f.description),
      icon: asText(f.icon) || undefined,
    }));
}

export function normaliseRecommendations(value: unknown): Recommendation[] {
  return asArray<Record<string, unknown>>(value)
    .filter((r) => isObject(r) && asText(r.name) && asText(r.quote))
    .map((r, index) => ({
      id: (r.id as string | number | undefined) ?? index,
      name: asText(r.name),
      role: asText(r.role),
      relation: asText(r.relation),
      quote: asText(r.quote),
      link: toWebUrl(r.link),
    }));
}

export function normaliseQuickFacts(value: unknown): Record<string, string> {
  if (!isObject(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(([, v]) => typeof v === 'string')
  ) as Record<string, string>;
}

// Visitors only receive resumes explicitly marked public, without private notes or internal file names.
export function toPublicResumes(resumes: unknown): PublicResume[] {
  return asArray<Record<string, unknown>>(resumes)
    .filter((r) => isObject(r) && r.isPublic === true && asText(r.cloudUrl))
    .map((r) => ({
      id: asText(r.id),
      name: asText(r.name),
      fileName: asText(r.fileName),
      fileSize: asText(r.fileSize),
      fileType: asText(r.fileType),
      uploadDate: asText(r.uploadDate),
      cloudUrl: asText(r.cloudUrl),
      role: isRoleId(r.role) ? r.role : undefined,
    }));
}

export function normaliseLinks(value: unknown): ProfileLink[] {
  return asArray<unknown>(value)
    .filter((l): l is Record<string, unknown> => isObject(l))
    .map((l) => ({ label: asText(l.label).trim().slice(0, 30), url: toWebUrl(l.url) }))
    .filter((l) => l.label && l.url)
    .slice(0, 10);
}

// A photo with the crop the admin chose; anything out of range is pulled back in
export function normalisePhoto(value: unknown): ProfilePhoto | undefined {
  if (!isObject(value)) return undefined;
  const file = normaliseMedia(value.file);
  if (!file) return undefined;
  const clamp = (n: unknown, min: number, max: number, fallback: number) =>
    typeof n === 'number' && Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
  return {
    file,
    focusX: clamp(value.focusX, 0, 100, 50),
    focusY: clamp(value.focusY, 0, 100, 50),
    zoom: clamp(value.zoom, 1, 3, 1),
  };
}

export function normalisePersonal(value: unknown): PersonalInfo {
  const stored = isObject(value) ? value : {};
  const info = {
    ...PERSONAL_INFO,
    ...stored,
    links: normaliseLinks(stored.links),
    photo: normalisePhoto(stored.photo),
  } as PersonalInfo;
  // the two main profile links are cleaned like any other address; an empty one means "not shown"
  return { ...info, github: toWebUrl(info.github), linkedin: toWebUrl(info.linkedin) };
}

export const SECTION_NAMES = [
  'personalInfo',
  'technicalSkills',
  'projects',
  'experience',
  'education',
  'certifications',
  'achievements',
  'quickFacts',
  'currentFocus',
  'recommendations',
  'siteSettings',
  'resumes',
] as const;

export type SectionName = (typeof SECTION_NAMES)[number];

// Builds the full public content from raw stored sections. A section that is missing falls back to
// the built-in content (recommendations and resumes default to empty).
export interface BuildOptions {
  // include projects, certificates and achievements that are drafts or hidden (for the admin's own previews)
  drafts?: boolean;
}

export function buildContent(
  sections: Record<string, unknown>,
  version = '',
  options: BuildOptions = {}
): PortfolioContent {
  const has = (name: string) => sections[name] !== undefined && sections[name] !== null;
  const everything = Boolean(options.drafts);

  return {
    personalInfo: normalisePersonal(sections.personalInfo),
    technicalSkills: normaliseSkills(
      has('technicalSkills') ? sections.technicalSkills : TECHNICAL_SKILLS
    ),
    projects: normaliseProjects(has('projects') ? sections.projects : PROJECTS).filter(
      (project) => everything || project.published !== false
    ),
    experience: normaliseExperience(has('experience') ? sections.experience : EXPERIENCE),
    education: normaliseEducation(has('education') ? sections.education : EDUCATION),
    certifications: normaliseCertifications(
      has('certifications') ? sections.certifications : CERTIFICATIONS
    ).filter((certificate) => everything || certificate.visible !== false),
    achievements: normaliseAchievements(
      has('achievements') ? sections.achievements : ACHIEVEMENTS
    ).filter((achievement) => everything || achievement.published !== false),
    currentFocus: normaliseFocus(has('currentFocus') ? sections.currentFocus : CURRENT_FOCUS),
    recommendations: normaliseRecommendations(sections.recommendations),
    quickFacts: normaliseQuickFacts(has('quickFacts') ? sections.quickFacts : QUICK_FACTS),
    siteSettings: mergeSiteSettings(sections.siteSettings),
    resumes: toPublicResumes(sections.resumes),
    version,
  };
}

// Applies one edited section (for example a draft from the admin editor) onto existing raw sections.
export function applyDraft(sections: Record<string, unknown>, section: string, data: unknown) {
  return { ...sections, [section]: data };
}
