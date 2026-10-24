// "Download my data": the public portfolio as JSON and CSV, built in the browser from what is on screen.
import { RoleSet } from './roles';
import type { PortfolioContent } from './types';

type Cell = string | number | boolean | undefined | null;

function csvCell(value: Cell): string {
  const text = value === undefined || value === null ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(rows: Cell[][]): string {
  return rows.map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
}

export function buildPortfolioJson(content: PortfolioContent, siteUrl = '') {
  const { personalInfo: p } = content;
  const roles = new RoleSet(content.siteSettings.roles);
  return {
    about: {
      name: p.name,
      shortName: p.shortName,
      title: p.title,
      subtitle: p.subtitle ?? '',
      description: p.description,
      about: p.about,
      location: p.location,
      email: p.email,
      phone: p.phone ?? '',
      github: p.github ?? '',
      linkedin: p.linkedin ?? '',
      otherLinks: p.links ?? [],
      cgpa: p.cgpa ?? '',
      graduation: p.graduation ?? '',
      website: siteUrl,
    },
    skills: content.technicalSkills.map((c) => ({ category: c.category, skills: c.skills })),
    projects: content.projects.map((project) => ({
      title: project.title,
      subtitle: project.subtitle ?? '',
      description: project.description,
      year: project.year ?? '',
      featured: Boolean(project.featured),
      status: project.status ?? '',
      tracks: roles.projectRoles(project),
      technologies: project.technologies,
      code: project.githubUrl ?? '',
      demo: project.liveUrl ?? '',
    })),
    experience: content.experience.map((e) => ({
      title: e.title,
      company: e.company,
      location: e.location ?? '',
      period: e.period,
      type: e.type ?? '',
      highlights: e.description,
    })),
    education: content.education.map((e) => ({
      degree: e.degree,
      institution: e.institution,
      location: e.location ?? '',
      period: e.period,
      grade: e.grade ?? '',
      coursework: e.coursework ?? [],
    })),
    certifications: content.certifications.map((c) => ({
      title: c.title,
      issuer: c.issuer,
      year: c.year ?? '',
      skills: c.skills ?? [],
      verification: c.verificationUrl ?? '',
    })),
    achievements: content.achievements,
    version: content.version,
  };
}

export function projectsCsv(content: PortfolioContent): string {
  const roles = new RoleSet(content.siteSettings.roles);
  return toCsv([
    [
      'title',
      'subtitle',
      'year',
      'featured',
      'status',
      'tracks',
      'technologies',
      'code',
      'demo',
      'description',
    ],
    ...content.projects.map((p) => [
      p.title,
      p.subtitle,
      p.year,
      Boolean(p.featured),
      p.status,
      roles.projectRoles(p).join('; '),
      p.technologies.join('; '),
      p.githubUrl,
      p.liveUrl,
      p.description,
    ]),
  ]);
}

export function skillsCsv(content: PortfolioContent): string {
  return toCsv([
    ['category', 'skill'],
    ...content.technicalSkills.flatMap((c) => c.skills.map((s) => [c.category, s])),
  ]);
}

export function certificationsCsv(content: PortfolioContent): string {
  return toCsv([
    ['title', 'issuer', 'year', 'skills', 'verification'],
    ...content.certifications.map((c) => [
      c.title,
      c.issuer,
      c.year,
      (c.skills ?? []).join('; '),
      c.verificationUrl,
    ]),
  ]);
}

export function experienceCsv(content: PortfolioContent): string {
  return toCsv([
    ['title', 'company', 'location', 'period', 'type', 'highlights'],
    ...content.experience.map((e) => [
      e.title,
      e.company,
      e.location,
      e.period,
      e.type,
      e.description.join(' | '),
    ]),
  ]);
}

export interface DownloadOption {
  id: string;
  label: string;
  filename: string;
  mime: string;
  build: (content: PortfolioContent, siteUrl: string) => string;
}

export const DOWNLOADS: DownloadOption[] = [
  {
    id: 'json',
    label: 'Everything (JSON)',
    filename: 'portfolio.json',
    mime: 'application/json',
    build: (content, siteUrl) => JSON.stringify(buildPortfolioJson(content, siteUrl), null, 2),
  },
  {
    id: 'projects',
    label: 'Projects (CSV)',
    filename: 'projects.csv',
    mime: 'text/csv',
    build: projectsCsv,
  },
  {
    id: 'skills',
    label: 'Skills (CSV)',
    filename: 'skills.csv',
    mime: 'text/csv',
    build: skillsCsv,
  },
  {
    id: 'certifications',
    label: 'Certifications (CSV)',
    filename: 'certifications.csv',
    mime: 'text/csv',
    build: certificationsCsv,
  },
  {
    id: 'experience',
    label: 'Experience (CSV)',
    filename: 'experience.csv',
    mime: 'text/csv',
    build: experienceCsv,
  },
];

// Triggers a file download in the browser
export function downloadText(filename: string, mime: string, text: string) {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
