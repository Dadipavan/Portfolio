// Turns the portfolio content into things the admin can tick for one resume, and turns the ticked
// choices into the document that is previewed and written to a PDF. The portfolio data itself is never changed.
import type { Achievement, Certification, Education, Experience, PersonalInfo, Project, SkillCategory } from '@/lib/types';
import { matchText, type Keyword } from './keywords';
import type { DocBlock, Run } from './pdf';

export type StdSection = 'summary' | 'skills' | 'experience' | 'projects' | 'education' | 'certifications' | 'achievements';
// the standard sections, plus the sections the admin adds ("custom:<id>")
export type SectionKey = StdSection | `custom:${string}`;

export const DEFAULT_ORDER: SectionKey[] = ['summary', 'skills', 'experience', 'projects', 'education', 'certifications', 'achievements'];

export const SECTION_TITLES: Record<StdSection, string> = {
  summary: 'Summary',
  skills: 'Skills',
  experience: 'Experience',
  projects: 'Projects',
  education: 'Education',
  certifications: 'Certifications',
  achievements: 'Achievements',
};

export interface PickLine {
  text: string;
  on: boolean;
  score: number;
}

export interface PickItem {
  key: string;
  on: boolean;
  left: string;
  right: string;
  sub: string;
  lines: PickLine[];
  score: number;
}

export interface SkillPick {
  category: string;
  on: boolean;
  skills: { name: string; on: boolean; hit: boolean }[];
}

// the details at the top of the resume; edited here without touching the profile
export interface ResumeHeader {
  name: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  links: { label: string; url: string }[];
}

export interface CustomSection {
  id: string;
  title: string;
  on: boolean;
  lines: PickLine[];
}

export interface BuilderItems {
  header: ResumeHeader;
  // headings the admin renamed ("Work history" instead of "Experience")
  titles: Partial<Record<StdSection, string>>;
  custom: CustomSection[];
  summary: string;
  skills: SkillPick[];
  experience: PickItem[];
  projects: PickItem[];
  education: PickItem[];
  certifications: PickItem[];
  achievements: PickItem[];
}

export interface SourceData {
  personalInfo: PersonalInfo;
  technicalSkills: SkillCategory[];
  experience: Experience[];
  projects: Project[];
  education: Education[];
  certifications: Certification[];
  achievements: Achievement[];
}

export function headerFrom(p: PersonalInfo): ResumeHeader {
  return {
    name: p?.name ?? '',
    headline: '',
    email: p?.email ?? '',
    phone: p?.phone ?? '',
    location: p?.location ?? '',
    linkedin: p?.linkedin ?? '',
    github: p?.github ?? '',
    links: (p?.links ?? []).map((l) => ({ label: l.label, url: l.url })),
  };
}

// Fills what older saved resumes do not have
export function normaliseItems(items: Partial<BuilderItems>, personal: PersonalInfo): BuilderItems {
  return {
    header: { ...headerFrom(personal), ...(items.header ?? {}) },
    titles: items.titles ?? {},
    custom: items.custom ?? [],
    summary: items.summary ?? '',
    skills: items.skills ?? [],
    experience: items.experience ?? [],
    projects: items.projects ?? [],
    education: items.education ?? [],
    certifications: items.certifications ?? [],
    achievements: items.achievements ?? [],
  };
}

export function newItem(): PickItem {
  return { key: `new:${Date.now()}${Math.random().toString(36).slice(2, 7)}`, on: true, left: '', right: '', sub: '', lines: [], score: 0 };
}

export function newLine(text = ''): PickLine {
  return { text, on: true, score: 0 };
}

export function newCustomSection(): CustomSection {
  return { id: `${Date.now()}${Math.random().toString(36).slice(2, 7)}`, title: 'New section', on: true, lines: [newLine()] };
}

// Everything offered with nothing ranked: the owner ticks what to include
export function ownSelect(data: SourceData): BuilderItems {
  const base = autoSelect(data, [], '');
  return {
    ...base,
    experience: base.experience.map((e) => ({ ...e, lines: e.lines.map((l) => ({ ...l, on: true })) })),
    projects: base.projects.map((p) => ({ ...p, on: false })),
    certifications: base.certifications.map((c) => ({ ...c, on: false })),
    achievements: base.achievements.map((a) => ({ ...a, on: false })),
  };
}

// ---------- text helpers ----------

// Long texts in the admin are Markdown; a resume needs plain words
export function plain(input: unknown): string {
  return String(input ?? '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^[#>\s*-]+\s*/gm, '')
    .replace(/[*_`~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function sentences(input: unknown, max = 3): string[] {
  const text = plain(input);
  if (!text) return [];
  const parts = text.match(/[^.!?]+(?:[.!?]+(?=\s|$)|$)/g) ?? [text];
  return parts.map((p) => p.trim()).filter((p) => p.length > 3).slice(0, max);
}

const key = (section: string, id: unknown, index: number) => `${section}:${id ?? index}`;

function lineOf(text: string, keywords: Keyword[]): PickLine {
  return { text, on: false, score: matchText(text, keywords).score };
}

// switches on the best-scoring lines (kept in their original order); at least `min` lines are on
function chooseLines(lines: PickLine[], max: number, min: number): PickLine[] {
  const ranked = lines.map((l, i) => ({ l, i })).sort((a, b) => b.l.score - a.l.score || a.i - b.i);
  const chosen = new Set<number>();
  for (const r of ranked) {
    if (chosen.size >= max) break;
    if (r.l.score > 0 || chosen.size < min) chosen.add(r.i);
  }
  return lines.map((l, i) => ({ ...l, on: chosen.has(i) }));
}

// ---------- choosing ----------

export function autoSelect(data: SourceData, keywords: Keyword[], headline: string): BuilderItems {
  const skills: SkillPick[] = (data.technicalSkills ?? []).map((c) => {
    const names = (c.skills ?? []).map((name) => ({ name, hit: matchText(name, keywords).matched.length > 0 }));
    // skills the JD asks for come first
    const sorted = [...names.filter((n) => n.hit), ...names.filter((n) => !n.hit)];
    return {
      category: c.category,
      on: true,
      skills: sorted.map((n) => ({ name: n.name, on: true, hit: n.hit })),
    };
  });
  // categories with a hit come first
  skills.sort((a, b) => Number(b.skills.some((s) => s.hit)) - Number(a.skills.some((s) => s.hit)));

  const experience: PickItem[] = (data.experience ?? []).map((e, i) => {
    const lines = chooseLines((e.description ?? []).map((d) => lineOf(plain(d), keywords)), i === 0 ? 6 : 4, 2);
    return {
      key: key('experience', e.id, i),
      on: true,
      left: e.title,
      right: e.period ?? '',
      sub: [e.company, e.location].filter(Boolean).join(', '),
      lines,
      score: lines.reduce((a, l) => a + l.score, 0) + matchText(`${e.title} ${e.company}`, keywords).score,
    };
  });

  const projects: PickItem[] = (data.projects ?? [])
    .filter((p) => p.published !== false)
    .map((p, i) => {
      const raw: PickLine[] = [
        ...sentences(p.description, 3),
        ...(p.keyFeatures ?? []).slice(0, 4).map(plain),
        ...sentences(p.results, 2),
        ...(p.metrics ?? []).slice(0, 3).map((m) => `${m.label}: ${m.value}`),
      ]
        .filter(Boolean)
        .map((t) => lineOf(t, keywords));
      const tech = [...(p.technologies ?? []), ...(p.tools ?? [])];
      const techScore = matchText(tech.join(' '), keywords).score;
      const lines = chooseLines(raw, 3, 2);
      return {
        key: key('projects', p.id, i),
        on: false,
        left: p.title,
        right: p.year ?? '',
        sub: tech.length ? `Tech: ${Array.from(new Set(tech)).join(', ')}` : '',
        lines,
        score: lines.reduce((a, l) => a + l.score, 0) + techScore * 2 + (matchText(p.title, keywords).score),
      };
    });
  // the three best-matching projects are on (featured ones win a tie)
  [...projects]
    .map((p, i) => ({ p, i, featured: (data.projects ?? []).filter((x) => x.published !== false)[i]?.featured ? 1 : 0 }))
    .sort((a, b) => b.p.score - a.p.score || b.featured - a.featured || a.i - b.i)
    .slice(0, 3)
    .forEach(({ p }) => {
      p.on = true;
    });

  const education: PickItem[] = (data.education ?? []).map((e, i) => {
    const course = (e.coursework ?? []).length ? [lineOf(`Relevant coursework: ${(e.coursework ?? []).join(', ')}`, keywords)] : [];
    return {
      key: key('education', e.id, i),
      on: true,
      left: e.institution,
      right: e.period ?? '',
      sub: [e.degree, e.grade].filter(Boolean).join(', '),
      lines: course.map((l) => ({ ...l, on: l.score > 0 })),
      score: course.reduce((a, l) => a + l.score, 0),
    };
  });

  // the same certificate entered twice is offered once
  const seen = new Set<string>();
  const certifications: PickItem[] = (data.certifications ?? [])
    .filter((c) => c.visible !== false)
    .filter((c) => {
      const id = `${c.title}|${c.issuer}`.toLowerCase().trim();
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    })
    .map((c, i) => {
      const text = [c.title, c.issuer ? `– ${c.issuer}` : '', c.issueDate || c.year ? `(${c.issueDate || c.year})` : '']
        .filter(Boolean)
        .join(' ');
      const score = matchText(`${c.title} ${(c.skills ?? []).join(' ')} ${c.description ?? ''}`, keywords).score;
      return {
        key: key('certifications', c.id, i),
        on: false,
        left: c.title,
        right: '',
        sub: '',
        lines: [{ text, on: true, score }],
        score,
      };
    });
  [...certifications]
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .forEach((c, i) => {
      if (c.score > 0 || i < 2) c.on = true;
    });

  const achievements: PickItem[] = (data.achievements ?? [])
    .filter((a) => a.published !== false)
    .map((a, i) => {
      const body = sentences(a.description, 1)[0] ?? '';
      const text = [a.title, body && `– ${body}`].filter(Boolean).join(' ');
      const score = matchText(`${a.title} ${plain(a.description)} ${plain(a.impact)}`, keywords).score;
      return {
        key: key('achievements', a.id, i),
        on: false,
        left: a.title,
        right: '',
        sub: '',
        lines: [{ text, on: true, score }],
        score,
      };
    });
  [...achievements]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .forEach((a, i) => {
      if (a.score > 0 || i < 2) a.on = true;
    });

  return {
    header: headerFrom(data.personalInfo),
    titles: {},
    custom: [],
    summary: draftSummary(data.personalInfo, skills, headline),
    skills,
    experience,
    projects,
    education,
    certifications,
    achievements,
  };
}

// A starting summary from the owner's own profile text; it is meant to be edited
export function draftSummary(personal: PersonalInfo, skills: SkillPick[], headline: string): string {
  const title = (headline || personal?.title || '').trim();
  const hits = skills.flatMap((c) => c.skills.filter((s) => s.hit).map((s) => s.name));
  const picked = (hits.length ? hits : skills.flatMap((c) => c.skills.map((s) => s.name))).slice(0, 5);
  const about = sentences(personal?.about, 1)[0] ?? '';
  const head = title ? `${title}${picked.length ? ` skilled in ${picked.join(', ')}` : ''}.` : '';
  return [head, about].filter(Boolean).join(' ');
}

// ---------- the document ----------

function webLabel(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '');
}

function toUrl(value: string): string {
  const v = value.trim();
  if (!v) return '';
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}

export function contactRuns(h: ResumeHeader): Run[] {
  const parts: Run[][] = [];
  if (h.email.trim()) parts.push([{ text: h.email.trim(), url: `mailto:${h.email.trim()}` }]);
  if (h.phone.trim()) parts.push([{ text: h.phone.trim() }]);
  if (h.location.trim()) parts.push([{ text: h.location.trim() }]);
  if (h.linkedin.trim()) parts.push([{ text: webLabel(h.linkedin.trim()), url: toUrl(h.linkedin) }]);
  if (h.github.trim()) parts.push([{ text: webLabel(h.github.trim()), url: toUrl(h.github) }]);
  for (const l of h.links) if (l.url.trim()) parts.push([{ text: webLabel(l.url.trim()), url: toUrl(l.url) }]);
  const out: Run[] = [];
  parts.forEach((part, i) => {
    if (i > 0) out.push({ text: '  |  ' });
    out.push(...part);
  });
  return out;
}

export function sectionTitle(items: BuilderItems, key: SectionKey): string {
  if (key.startsWith('custom:')) return items.custom.find((c) => `custom:${c.id}` === key)?.title ?? '';
  const std = key as StdSection;
  return (items.titles[std] ?? '').trim() || SECTION_TITLES[std];
}

export function buildBlocks(items: BuilderItems, order: SectionKey[] = DEFAULT_ORDER): DocBlock[] {
  const blocks: DocBlock[] = [];
  const h = items.header;
  blocks.push({ kind: 'name', text: h.name });
  if (h.headline.trim()) blocks.push({ kind: 'tagline', text: h.headline.trim() });
  const contact = contactRuns(h);
  if (contact.length) blocks.push({ kind: 'contact', runs: contact });

  const entries = (list: PickItem[]) => {
    for (const it of list.filter((x) => x.on)) {
      if (!it.left.trim() && !it.right.trim() && !it.sub.trim() && !it.lines.some((l) => l.on && l.text.trim())) continue;
      blocks.push({ kind: 'entry', left: it.left, right: it.right || undefined, sub: it.sub || undefined });
      for (const l of it.lines.filter((x) => x.on && x.text.trim())) blocks.push({ kind: 'bullet', runs: [{ text: l.text.trim() }] });
    }
  };

  for (const section of order) {
    const title = sectionTitle(items, section);
    if (section.startsWith('custom:')) {
      const c = items.custom.find((x) => `custom:${x.id}` === section);
      const lines = c?.on ? c.lines.filter((l) => l.on && l.text.trim()) : [];
      if (c && lines.length) {
        blocks.push({ kind: 'heading', text: title || 'Section' });
        for (const l of lines) blocks.push({ kind: 'bullet', runs: [{ text: l.text.trim() }] });
      }
    } else if (section === 'summary') {
      if (items.summary.trim()) {
        blocks.push({ kind: 'heading', text: title });
        blocks.push({ kind: 'text', runs: [{ text: items.summary.trim() }] });
      }
    } else if (section === 'skills') {
      const rows = items.skills
        .filter((c) => c.on)
        .map((c) => ({ category: c.category.trim(), names: c.skills.filter((s) => s.on && s.name.trim()).map((s) => s.name.trim()) }))
        .filter((c) => c.names.length);
      if (rows.length) {
        blocks.push({ kind: 'heading', text: title });
        for (const r of rows)
          blocks.push({ kind: 'text', runs: [...(r.category ? [{ text: `${r.category}: `, bold: true }] : []), { text: r.names.join(', ') }] });
      }
    } else if (section === 'experience' || section === 'projects' || section === 'education') {
      const list = items[section];
      if (list.some((x) => x.on)) {
        const start = blocks.length;
        blocks.push({ kind: 'heading', text: title });
        entries(list);
        if (blocks.length === start + 1) blocks.pop();
      }
    } else {
      const list = items[section as 'certifications' | 'achievements'].filter((x) => x.on);
      const lines = list.flatMap((x) => x.lines.filter((l) => l.on && l.text.trim()));
      if (lines.length) {
        blocks.push({ kind: 'heading', text: title });
        for (const l of lines) blocks.push({ kind: 'bullet', runs: [{ text: l.text.trim() }] });
      }
    }
  }
  return blocks;
}

// All the words of the document, for the keyword check
export function blocksText(blocks: DocBlock[]): string {
  const parts: string[] = [];
  for (const b of blocks) {
    if (b.kind === 'entry') parts.push(b.left, b.sub ?? '');
    else if (b.kind === 'name' || b.kind === 'heading' || b.kind === 'tagline') parts.push(b.text);
    else parts.push(b.runs.map((r) => r.text).join(''));
  }
  return parts.join('\n');
}
