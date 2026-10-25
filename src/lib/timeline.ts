// One timeline from education, experience, certifications and projects.
import { RoleSet } from './roles';
import type { PortfolioContent, TimelineEdits, TrackId } from './types';

export type TimelineType = 'education' | 'experience' | 'certification' | 'project' | 'milestone';

export interface TimelineItem {
  id: string; // doubles as the anchor id of the item on the page
  type: TimelineType;
  title: string;
  subtitle: string;
  label: string; // the period as written
  startYear: number;
  startMonth?: number;
  endYear?: number;
  ongoing: boolean;
  tracks: TrackId[];
  skills: string[];
  // a milestone added in the admin can link somewhere
  href?: string;
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

export interface ParsedPeriod {
  startYear: number;
  startMonth?: number;
  endYear?: number;
  endMonth?: number;
  ongoing: boolean;
}

// "Oct 2022 – Jun 2026 (Expected)", "Jul 2024 – Present", "2020 – 2022", "2025"
export function parsePeriod(text: string): ParsedPeriod | null {
  const source = text.toLowerCase();
  const years = Array.from(source.matchAll(/\b(19|20)\d{2}\b/g)).map((m) => ({
    year: Number(m[0]),
    index: m.index ?? 0,
  }));
  if (years.length === 0) return null;

  const monthBefore = (index: number): number | undefined => {
    const before = source.slice(Math.max(0, index - 12), index);
    const match = before.match(/([a-z]{3,9})\.?\s*$/);
    if (!match) return undefined;
    const position = MONTHS.indexOf(match[1].slice(0, 3));
    return position >= 0 ? position + 1 : undefined;
  };

  const first = years[0];
  const last = years[years.length - 1];
  const ongoing = /\b(present|current|now|ongoing|till date|to date)\b/.test(source);

  return {
    startYear: first.year,
    startMonth: monthBefore(first.index),
    endYear: years.length > 1 ? last.year : undefined,
    endMonth: years.length > 1 ? monthBefore(last.index) : undefined,
    ongoing,
  };
}

// Everything the content produces, before the admin's edits and in no particular order
export function collectTimeline(content: PortfolioContent): TimelineItem[] {
  const roles = new RoleSet(content.siteSettings.roles);
  const items: TimelineItem[] = [];

  content.education.forEach((edu) => {
    const parsed = parsePeriod(edu.period);
    if (!parsed) return;
    items.push({
      id: `education-${edu.id}`,
      type: 'education',
      title: edu.degree,
      subtitle: edu.institution,
      label: edu.period,
      startYear: parsed.startYear,
      startMonth: parsed.startMonth,
      endYear: parsed.endYear,
      ongoing: parsed.ongoing,
      tracks: [],
      skills: edu.coursework ?? [],
    });
  });

  content.experience.forEach((role) => {
    const parsed = parsePeriod(role.period);
    if (!parsed) return;
    items.push({
      id: `experience-${role.id}`,
      type: 'experience',
      title: role.title,
      subtitle: role.company,
      label: role.period,
      startYear: parsed.startYear,
      startMonth: parsed.startMonth,
      endYear: parsed.endYear,
      ongoing: parsed.ongoing,
      tracks: [],
      skills: [],
    });
  });

  content.certifications.forEach((cert, index) => {
    const parsed = cert.year ? parsePeriod(cert.year) : null;
    if (!parsed) return;
    items.push({
      id: `certification-${index}`,
      type: 'certification',
      title: cert.title,
      subtitle: cert.issuer,
      label: cert.year ?? '',
      startYear: parsed.startYear,
      ongoing: false,
      tracks: [],
      skills: cert.skills ?? [],
    });
  });

  content.projects.forEach((project) => {
    const parsed = project.year ? parsePeriod(project.year) : null;
    if (!parsed) return;
    items.push({
      id: `project-${project.id}`,
      type: 'project',
      title: project.title,
      subtitle: project.subtitle ?? '',
      label: project.year ?? '',
      startYear: parsed.startYear,
      ongoing: false,
      tracks: roles.projectRoles(project),
      skills: project.technologies,
    });
  });

  return items;
}

// Newest first; within a year, later months first; ties keep a stable order by type
export function sortTimeline(items: TimelineItem[]): TimelineItem[] {
  const order: TimelineType[] = [
    'experience',
    'education',
    'project',
    'certification',
    'milestone',
  ];
  return items
    .map((item, position) => ({ item, position }))
    .sort(
      (a, b) =>
        b.item.startYear * 12 +
          (b.item.startMonth ?? 6) -
          (a.item.startYear * 12 + (a.item.startMonth ?? 6)) ||
        order.indexOf(a.item.type) - order.indexOf(b.item.type) ||
        a.position - b.position
    )
    .map((entry) => entry.item);
}

// The admin's choices: entries left out, entries reworded or moved to another year, and milestones of their own
export function applyTimelineEdits(items: TimelineItem[], edits: TimelineEdits): TimelineItem[] {
  const hidden = new Set(edits.hidden);
  const shown = items
    .filter((item) => !hidden.has(item.id))
    .map((item) => {
      const change = edits.overrides[item.id];
      if (!change) return item;
      return {
        ...item,
        title: change.title || item.title,
        subtitle: change.subtitle ?? item.subtitle,
        ...(change.year
          ? {
              startYear: change.year,
              startMonth: undefined,
              endYear: undefined,
              ongoing: false,
              label: String(change.year),
            }
          : {}),
      };
    });
  const own = edits.custom.map<TimelineItem>((milestone) => ({
    id: `milestone-${milestone.id}`,
    type: 'milestone',
    title: milestone.title,
    subtitle: milestone.subtitle,
    label: String(milestone.year),
    startYear: milestone.year,
    ongoing: false,
    tracks: [],
    skills: [],
    ...(milestone.url ? { href: milestone.url } : {}),
  }));
  return [...shown, ...own];
}

export function buildTimeline(content: PortfolioContent): TimelineItem[] {
  return sortTimeline(
    applyTimelineEdits(collectTimeline(content), content.siteSettings.timelineEdits)
  );
}
