// Compares what is stored in the admin panel with what the public site shows, item by item.
import { buildContent } from '@/lib/normalize';
import { COPY_FIELDS, makeTranslate, type CopyKey } from '@/lib/copy';
import { mergeSiteSettings, SECTION_IDS } from '@/lib/siteSettings';

export type ItemStatus = 'shown' | 'hidden' | 'private';

export interface MapItem {
  label: string;
  status: ItemStatus;
  note?: string;
  href?: string;
}

export interface MapSection {
  id: string;
  label: string;
  where: string;
  stored: number;
  shown: number;
  href: string;
  items: MapItem[];
}

const arr = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
const text = (value: unknown) => (typeof value === 'string' ? value : '');

export function buildContentMap(sections: Record<string, unknown>): MapSection[] {
  const content = buildContent(sections);
  const settings = mergeSiteSettings(sections.siteSettings);
  const t = makeTranslate(settings.copy);
  const result: MapSection[] = [];

  const list = (
    id: string,
    label: string,
    where: string,
    href: string,
    raw: Record<string, unknown>[],
    titleOf: (item: Record<string, unknown>) => string,
    isShown: (item: Record<string, unknown>, index: number) => boolean,
    anchor?: (item: Record<string, unknown>, index: number) => string
  ) => {
    const items: MapItem[] = raw.map((item, index) => {
      const shown = isShown(item, index);
      return {
        label: titleOf(item) || `(untitled item ${index + 1})`,
        status: shown ? 'shown' : 'hidden',
        note: shown ? undefined : 'Not shown: it needs a title',
        href: shown && anchor ? anchor(item, index) : undefined,
      };
    });
    result.push({
      id,
      label,
      where,
      stored: raw.length,
      shown: items.filter((i) => i.status === 'shown').length,
      href,
      items,
    });
  };

  // personal details and the text blocks around them
  const personal = (sections.personalInfo ?? {}) as Record<string, unknown>;
  const personalFields: [string, string][] = [
    ['name', 'Name'],
    ['shortName', 'Short name'],
    ['title', 'Headline'],
    ['subtitle', 'Subtitle'],
    ['description', 'Intro paragraph'],
    ['about', 'About text'],
    ['location', 'Location'],
    ['email', 'Email'],
    ['phone', 'Phone'],
    ['github', 'GitHub link'],
    ['linkedin', 'LinkedIn link'],
    ['cgpa', 'CGPA'],
    ['graduation', 'Graduation'],
  ];
  result.push({
    id: 'personalInfo',
    label: 'Personal info',
    where: 'Hero, About, Contact, footer, CV, JSON',
    stored: personalFields.filter(([key]) => text(personal[key])).length,
    shown: personalFields.filter(([key]) => text(personal[key])).length,
    href: '/#top',
    items: personalFields.map(([key, label]) => ({
      label,
      status: text(personal[key]) ? 'shown' : 'hidden',
      note: text(personal[key]) ? undefined : 'Empty',
      href: '/#top',
    })),
  });

  list(
    'technicalSkills',
    'Skills',
    'Skills, role pipeline, charts, explorer, CV',
    '/#skills',
    arr(sections.technicalSkills),
    (c) => `${text(c.category)} (${Array.isArray(c.skills) ? c.skills.length : 0} skills)`,
    (c) => content.technicalSkills.some((x) => x.category === text(c.category)),
    () => '/#skills'
  );

  list(
    'projects',
    'Projects',
    'Projects, charts, timeline, search, JSON, CV',
    '/#projects',
    arr(sections.projects),
    (p) => text(p.title),
    (p) => content.projects.some((x) => x.title === text(p.title)),
    (p, i) => `/#project-${p.id ?? i}`
  );

  list(
    'experience',
    'Experience',
    'Experience, timeline, CV',
    '/#experience',
    arr(sections.experience),
    (e) => `${text(e.title)}${e.company ? `, ${text(e.company)}` : ''}`,
    (e) => content.experience.some((x) => x.title === text(e.title)),
    (e, i) => `/#experience-${e.id ?? i}`
  );

  list(
    'education',
    'Education',
    'Education, timeline, CV',
    '/#education',
    arr(sections.education),
    (e) => text(e.degree) || text(e.institution),
    (e) => content.education.some((x) => x.institution === text(e.institution)),
    (e, i) => `/#education-${e.id ?? i}`
  );

  list(
    'certifications',
    'Certifications',
    'Certifications, timeline, explorer, CV',
    '/#certifications',
    arr(sections.certifications),
    (c) => text(c.title),
    (c) => content.certifications.some((x) => x.title === text(c.title)),
    (_c, i) => `/#certification-${i}`
  );

  list(
    'achievements',
    'Achievements',
    'Achievements, CV',
    '/#achievements',
    arr(sections.achievements),
    (a) => text(a.title),
    (a) => content.achievements.some((x) => x.title === text(a.title)),
    (_a, i) => `/#achievement-${i}`
  );

  list(
    'currentFocus',
    'Current focus',
    'About',
    '/#about',
    arr(sections.currentFocus),
    (f) => text(f.title),
    (f) => content.currentFocus.some((x) => x.title === text(f.title)),
    () => '/#about'
  );

  const facts = Object.entries((sections.quickFacts ?? {}) as Record<string, unknown>).filter(
    ([, v]) => typeof v === 'string' && v
  );
  result.push({
    id: 'quickFacts',
    label: 'Quick facts',
    where: 'About',
    stored: facts.length,
    shown: facts.length,
    href: '/#about',
    items: facts.map(([key, value]) => ({
      label: `${key}: ${value}`,
      status: 'shown',
      href: '/#about',
    })),
  });

  list(
    'recommendations',
    'Recommendations',
    'Recommendations wall',
    '/#recommendations',
    arr(sections.recommendations),
    (r) => `${text(r.name)}`,
    (r) => content.recommendations.some((x) => x.name === text(r.name)),
    (r, i) => `/#recommendation-${r.id ?? i}`
  );

  // resumes are private unless marked public
  const resumes = arr(sections.resumes);
  const publicResumes = content.resumes;
  result.push({
    id: 'resumes',
    label: 'Resumes',
    where: 'Resume button (only resumes marked Public)',
    stored: resumes.length,
    shown: publicResumes.length,
    href: '/#top',
    items: resumes.map((r) => {
      const isPublic = publicResumes.some((x) => x.id === text(r.id));
      return {
        label: text(r.name) || text(r.fileName),
        status: isPublic ? 'shown' : 'private',
        note: isPublic
          ? undefined
          : 'Private. Mark it Public in Admin > Resumes to offer it to visitors.',
        href: isPublic ? '/#top' : undefined,
      };
    }),
  });

  // settings and where each one appears
  const setting = (label: string, on: boolean, note: string, href: string): MapItem => ({
    label,
    status: on ? 'shown' : 'hidden',
    note: on ? undefined : note,
    href: on ? href : undefined,
  });
  const settingItems: MapItem[] = [
    setting(
      'Availability badge',
      settings.availability.enabled && Boolean(settings.availability.text),
      'Switched off in Site settings',
      '/#top'
    ),
    setting('Hero label', Boolean(settings.kicker), 'Empty in Site settings', '/#top'),
    setting(
      'Additional certifications',
      settings.additionalCertifications.length > 0,
      'None added in Site settings',
      '/#certifications'
    ),
    setting(
      'Work with me panel',
      settings.features.workWithMe && settings.workWithMe.enabled,
      'Switched off',
      '/#work'
    ),
    setting('Highlight numbers', true, '', '/#top'),
    setting(
      `Roles (${settings.roles.length})`,
      settings.roles.length > 0,
      'No roles set up in Admin > Roles',
      '/#top'
    ),
    ...SECTION_IDS.filter((id) => settings.sections.hidden.includes(id)).map((id) => ({
      label: `Section: ${id}`,
      status: 'hidden' as const,
      note: 'Switched off in Admin > Appearance',
    })),
    ...COPY_FIELDS.filter((f) => f.key.endsWith('.intro')).map((f) => {
      const id = f.key.split('.')[1];
      return setting(
        `Intro: ${id}`,
        Boolean(t(f.key as CopyKey)),
        'Empty in Admin > Text and labels',
        `/#${id}`
      );
    }),
  ];
  result.push({
    id: 'siteSettings',
    label: 'Site settings',
    where: 'Hero, roles, section introductions, Work with me',
    stored: settingItems.length,
    shown: settingItems.filter((i) => i.status === 'shown').length,
    href: '/',
    items: settingItems,
  });

  return result;
}
