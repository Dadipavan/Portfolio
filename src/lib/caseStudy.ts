// What a project's case study contains: which parts exist, in which order they are shown, and how to describe them
// to the admin. Shared by the public project window and by the admin editor. Pure functions.
import type { CopyKey } from './copy';
import { hasText } from './markdown';
import type { MediaFile, Project } from './types';

export type CaseKey =
  | 'overview'
  | 'problem'
  | 'objectives'
  | 'dataSources'
  | 'approach'
  | 'implementation'
  | 'results'
  | 'challenges'
  | 'solutions'
  | 'conclusions'
  | 'learnings';

export interface CaseSectionDef {
  key: CaseKey;
  // the heading on the site (editable in Admin > Text and labels)
  copy: CopyKey;
  // what the admin sees
  label: string;
  hint: string;
  rows: number;
}

// The order the parts are told in: what it is, why, how, what came out, what was hard, what was learned
export const CASE_SECTION_DEFS: CaseSectionDef[] = [
  {
    key: 'overview',
    copy: 'case.overview',
    label: 'Overview',
    hint: 'What the project is, who it is for and what it does, in a few paragraphs.',
    rows: 6,
  },
  {
    key: 'problem',
    copy: 'case.problem',
    label: 'Problem statement',
    hint: 'The question or difficulty the project tackles.',
    rows: 5,
  },
  {
    key: 'objectives',
    copy: 'case.objectives',
    label: 'Objectives',
    hint: 'What you set out to achieve. A list works well.',
    rows: 5,
  },
  {
    key: 'dataSources',
    copy: 'case.dataSources',
    label: 'Data sources',
    hint: 'Where the data came from, how big it was, how it was cleaned.',
    rows: 5,
  },
  {
    key: 'approach',
    copy: 'case.methodology',
    label: 'Methodology',
    hint: 'The method and the reasons for choosing it.',
    rows: 6,
  },
  {
    key: 'implementation',
    copy: 'case.implementation',
    label: 'Implementation',
    hint: 'How it was built: steps, architecture, tools. Code snippets are welcome.',
    rows: 8,
  },
  {
    key: 'results',
    copy: 'case.results',
    label: 'Results',
    hint: 'What happened. Put the measurable outcomes in "Numbers" below.',
    rows: 6,
  },
  {
    key: 'challenges',
    copy: 'case.challenges',
    label: 'Challenges',
    hint: 'What was difficult.',
    rows: 5,
  },
  {
    key: 'solutions',
    copy: 'case.solutions',
    label: 'How I solved them',
    hint: 'What you did about each challenge.',
    rows: 5,
  },
  {
    key: 'conclusions',
    copy: 'case.conclusions',
    label: 'Conclusions and next steps',
    hint: 'What the project showed and what you would do next.',
    rows: 5,
  },
  {
    key: 'learnings',
    copy: 'case.learnings',
    label: 'What I learned',
    hint: 'Skills or lessons you took away.',
    rows: 4,
  },
];

export interface CaseSectionContent {
  key: CaseKey;
  copy: CopyKey;
  body: string;
}

// Only the parts that have been written (nothing is invented for the parts that have not)
export function writtenSections(project: Project): CaseSectionContent[] {
  return CASE_SECTION_DEFS.filter((def) => hasText(project[def.key] as string | undefined)).map(
    (def) => ({
      key: def.key,
      copy: def.copy,
      body: project[def.key] as string,
    })
  );
}

export function customSections(project: Project): { id: string; title: string; body: string }[] {
  return (project.sections ?? []).filter(
    (section) => hasText(section.body) && section.title.trim()
  );
}

export const keyFeatureList = (project: Project): string[] =>
  (project.keyFeatures ?? []).map((f) => f.trim()).filter(Boolean);

export const metricList = (project: Project) =>
  (project.metrics ?? []).filter((m) => m.label.trim() && m.value.trim());

export function hasFacts(project: Project): boolean {
  return Boolean(
    project.role || project.teamSize || project.startDate || project.endDate || project.category
  );
}

// Is there anything beyond the card text, so that "View more" has more to show?
export function hasCaseStudy(project: Project): boolean {
  return Boolean(
    writtenSections(project).length > 0 ||
      customSections(project).length > 0 ||
      keyFeatureList(project).length > 0 ||
      metricList(project).length > 0 ||
      (project.media && project.media.length > 0) ||
      (project.images && project.images.length > 0) ||
      hasFacts(project)
  );
}

// Dashboards and screenshots tell the story of an analytics project best, so the pictures come first for them;
// a project told mostly in words (a model and its evaluation) opens with the text.
export function visualFirst(project: Project): boolean {
  const media = project.media ?? [];
  const visual = media.filter((m) => m.kind === 'dashboard' || m.kind === 'screenshot').length;
  return visual >= 2 || (visual >= 1 && visual === media.length);
}

export const KIND_LABELS: Record<NonNullable<MediaFile['kind']>, string> = {
  screenshot: 'Screenshot',
  dashboard: 'Dashboard',
  chart: 'Chart',
  diagram: 'Diagram',
  photo: 'Photo',
  document: 'Document',
};

// Pictures given as web addresses (older entries) take part in the gallery next to uploaded ones
export function galleryOf(project: Project): {
  id: string;
  src: string;
  alt: string;
  caption?: string;
  kind?: MediaFile['kind'];
  width?: number;
  height?: number;
  file?: MediaFile;
}[] {
  const uploaded = (project.media ?? [])
    .filter((m) => m.mime.startsWith('image/'))
    .map((file) => ({
      id: file.id,
      src: `/api/media/${file.path}`,
      alt:
        file.alt ||
        file.caption ||
        `${project.title}: ${KIND_LABELS[file.kind ?? 'screenshot'].toLowerCase()}`,
      caption: file.caption,
      kind: file.kind,
      width: file.width,
      height: file.height,
      file,
    }));
  const linked = (project.images ?? []).map((src, index) => ({
    id: `url-${index}`,
    src,
    alt: `${project.title}: picture ${index + 1}`,
    caption: undefined as string | undefined,
    kind: undefined as MediaFile['kind'] | undefined,
    width: undefined as number | undefined,
    height: undefined as number | undefined,
    file: undefined as MediaFile | undefined,
  }));
  return [...uploaded, ...linked];
}

// Pictures among a list of uploaded files (for achievements, which use the same gallery as projects)
export function mediaGallery(files: MediaFile[] | undefined, title: string) {
  return galleryOf({
    title,
    technologies: [],
    id: 'x',
    description: '',
    media: files,
  } as Project).filter((item) => item.file);
}
