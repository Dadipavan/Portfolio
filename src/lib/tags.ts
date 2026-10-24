// Tags (skills, technologies, course names, certificate skills) and the evidence behind each one.
// Every tag shown anywhere on the site can look itself up here to show where it is proven.
import type { PortfolioContent } from './types';

const ALIASES: Record<string, string> = {
  sklearn: 'scikit-learn',
  'scikit learn': 'scikit-learn',
  js: 'javascript',
  reactjs: 'react',
  'react.js': 'react',
  nodejs: 'node.js',
  node: 'node.js',
  tf: 'tensorflow',
  ml: 'machine learning',
  dl: 'deep learning',
  powerbi: 'power bi',
  postgres: 'postgresql',
  html5: 'html',
  css3: 'css',
};

const clean = (value: string) => value.toLowerCase().replace(/\s+/g, ' ').trim();

// Canonical key of a label: lowercase, parenthetical notes dropped, aliases applied
export function tagKey(label: string): string {
  const base = clean(label.replace(/\([^)]*\)/g, ' '));
  return ALIASES[base] ?? base;
}

// All keys a label answers to: its own key plus the parts of "A/B" and "A (B, C)" style labels
export function tagKeys(label: string): string[] {
  const keys = new Set<string>([tagKey(label)]);

  const parenthetical = label.match(/\(([^)]*)\)/);
  if (parenthetical) {
    parenthetical[1]
      .split(/[,;/]/)
      .map((part) => tagKey(part))
      .filter(Boolean)
      .forEach((key) => keys.add(key));
  }

  const base = label.replace(/\([^)]*\)/g, ' ').trim();
  if (base.includes('/') && !/\s/.test(base)) {
    base
      .split('/')
      .map((part) => tagKey(part))
      .filter(Boolean)
      .forEach((key) => keys.add(key));
  }

  keys.delete('');
  return Array.from(keys);
}

export interface EvidenceProject {
  id: string | number;
  title: string;
  subtitle?: string;
  year?: string;
}
export interface EvidenceCertification {
  index: number;
  title: string;
  issuer: string;
  year?: string;
  verificationUrl?: string;
}
export interface EvidenceCourse {
  id: string | number;
  degree: string;
  institution: string;
  period: string;
}
export interface EvidenceExperience {
  id: string | number;
  title: string;
  company: string;
  period: string;
}

export interface TagEvidence {
  key: string;
  label: string;
  projects: EvidenceProject[];
  certifications: EvidenceCertification[];
  coursework: EvidenceCourse[];
  experience: EvidenceExperience[];
  skillCategories: string[];
  related: { key: string; label: string; count: number }[];
}

export type EvidenceIndex = Record<string, TagEvidence>;

export const evidenceTotal = (e: TagEvidence) =>
  e.projects.length + e.certifications.length + e.coursework.length + e.experience.length;

// A tag is worth linking when something other than its own mention backs it up
export function isLinkable(index: EvidenceIndex, label: string): boolean {
  const e = index[tagKey(label)];
  return Boolean(e && (evidenceTotal(e) > 0 || e.related.length > 0));
}

export function buildEvidenceIndex(content: PortfolioContent): EvidenceIndex {
  const index: EvidenceIndex = {};
  const pairs = new Map<string, number>();

  const entry = (label: string, key: string): TagEvidence => {
    if (!index[key]) {
      index[key] = {
        key,
        label: tagKey(label) === key ? label.replace(/\s*\([^)]*\)/g, '').trim() || label : key,
        projects: [],
        certifications: [],
        coursework: [],
        experience: [],
        skillCategories: [],
        related: [],
      };
    }
    return index[key];
  };

  // Groups of tags that appear together (a project's stack, a certificate's skills, ...)
  const groups: string[][] = [];
  const register = (labels: string[], apply: (e: TagEvidence) => void) => {
    const groupKeys = new Set<string>();
    labels.forEach((label) =>
      tagKeys(label).forEach((key) => {
        apply(entry(label, key));
        groupKeys.add(key);
      })
    );
    groups.push(Array.from(groupKeys));
  };

  content.projects.forEach((project) => {
    const summary: EvidenceProject = {
      id: project.id,
      title: project.title,
      subtitle: project.subtitle,
      year: project.year,
    };
    register(project.technologies, (e) => {
      if (!e.projects.some((p) => p.id === project.id)) e.projects.push(summary);
    });
  });

  content.certifications.forEach((cert, i) => {
    const summary: EvidenceCertification = {
      index: i,
      title: cert.title,
      issuer: cert.issuer,
      year: cert.year,
      verificationUrl: cert.verificationUrl,
    };
    register(cert.skills ?? [], (e) => {
      if (!e.certifications.some((c) => c.index === i)) e.certifications.push(summary);
    });
  });

  content.education.forEach((edu) => {
    const summary: EvidenceCourse = {
      id: edu.id,
      degree: edu.degree,
      institution: edu.institution,
      period: edu.period,
    };
    register(edu.coursework ?? [], (e) => {
      if (!e.coursework.some((c) => c.id === edu.id)) e.coursework.push(summary);
    });
  });

  content.technicalSkills.forEach((category) => {
    register(category.skills, (e) => {
      if (!e.skillCategories.includes(category.category)) e.skillCategories.push(category.category);
    });
  });

  // Experience: a tag counts when it is mentioned in a role's title or bullet points
  content.experience.forEach((role) => {
    const haystack = ` ${[role.title, role.company, ...role.description].join(' | ').toLowerCase()} `;
    const summary: EvidenceExperience = {
      id: role.id,
      title: role.title,
      company: role.company,
      period: role.period,
    };
    Object.values(index).forEach((e) => {
      if (e.key.length < 3) return;
      const escaped = e.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (
        new RegExp(`[^a-z0-9]${escaped}[^a-z0-9]`).test(haystack) &&
        !e.experience.some((x) => x.id === role.id)
      ) {
        e.experience.push(summary);
      }
    });
  });

  // Tags that appear together are related; keep the strongest neighbours of each
  groups.forEach((keys) => {
    for (let a = 0; a < keys.length; a++) {
      for (let b = a + 1; b < keys.length; b++) {
        const id = keys[a] < keys[b] ? `${keys[a]}\u0000${keys[b]}` : `${keys[b]}\u0000${keys[a]}`;
        pairs.set(id, (pairs.get(id) ?? 0) + 1);
      }
    }
  });
  const neighbours = new Map<string, { key: string; count: number }[]>();
  pairs.forEach((count, id) => {
    const [a, b] = id.split('\u0000');
    neighbours.set(a, [...(neighbours.get(a) ?? []), { key: b, count }]);
    neighbours.set(b, [...(neighbours.get(b) ?? []), { key: a, count }]);
  });
  Object.values(index).forEach((e) => {
    e.related = (neighbours.get(e.key) ?? [])
      .sort((x, y) => y.count - x.count || x.key.localeCompare(y.key))
      .slice(0, 8)
      .map((n) => ({ key: n.key, label: index[n.key]?.label ?? n.key, count: n.count }));
  });

  return index;
}
