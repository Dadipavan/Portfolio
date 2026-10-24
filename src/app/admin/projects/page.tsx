'use client';

import { useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Eye,
  FolderKanban,
  Image as ImageIcon,
  Plus,
  Star,
  Trash2,
} from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import AdminLoadError from '@/components/AdminLoadError';
import { useConfirm, useNotify } from '@/components/admin/Feedback';
import {
  FieldError,
  PageHeader,
  Panel,
  TagsInput,
  Toggle,
  buttonClass,
  hintClass,
  inputClass,
  labelClass,
  primaryButtonClass,
} from '@/components/admin/kit';
import { EditorBar, RowActions, StatusBadge } from '@/components/admin/ListParts';
import MarkdownEditor from '@/components/admin/MarkdownEditor';
import { MediaListEditor } from '@/components/admin/MediaEditors';
import { useEditor } from '@/components/admin/useEditor';
import { idOf, useListOps } from '@/components/admin/useListOps';
import CaseStudyBody from '@/components/site/case/CaseStudyBody';
import Modal from '@/components/site/Modal';
import { CASE_SECTION_DEFS, hasCaseStudy, writtenSections } from '@/lib/caseStudy';
import { makeTranslate } from '@/lib/copy';
import { hasText } from '@/lib/markdown';
import { normaliseProjects } from '@/lib/normalize';
import { useDraftSync } from '@/lib/previewBus';
import { RoleSet } from '@/lib/roles';
import type { CaseStudySection, MediaKind, Project } from '@/lib/types';
import { toWebUrl } from '@/lib/url';
import { useStoredList } from '@/lib/useStoredList';

type Stored = Record<string, unknown>;
type Tab = 'basics' | 'story' | 'media';

const MEDIA_KINDS: { value: MediaKind; label: string }[] = [
  { value: 'screenshot', label: 'Screenshot' },
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'chart', label: 'Chart' },
  { value: 'diagram', label: 'Diagram' },
  { value: 'photo', label: 'Photo' },
];

const CATEGORY_SUGGESTIONS = [
  'Machine learning',
  'Deep learning',
  'Natural language processing',
  'Data analysis',
  'Dashboard',
  'Data engineering',
  'Web application',
  'Research',
];

const blank = (id: number): Project => ({
  id,
  title: '',
  subtitle: '',
  description: '',
  technologies: [],
  githubUrl: '',
  liveUrl: '',
  year: String(new Date().getFullYear()),
  featured: false,
  status: 'completed',
  // a new project is a draft until it is published on purpose
  published: false,
  media: [],
  metrics: [],
  keyFeatures: [],
  sections: [],
  tools: [],
});

const mediaPaths = (project: Project) => (project.media ?? []).map((file) => file.path);

// A saved project as the editor and the list work with it. Items saved without a title are still shown, so they can be
// edited or deleted instead of being stuck out of sight.
function view(item: Stored): Project {
  const title = typeof item.title === 'string' && item.title.trim() ? item.title : '(Untitled project)';
  return normaliseProjects([{ ...item, title }])[0];
}

export default function ProjectsAdmin() {
  return (
    <AdminLayout>
      <ProjectsContent />
    </AdminLayout>
  );
}

function ProjectsContent() {
  const list = useStoredList('projects');
  const [editing, setEditing] = useState<{ draft: Project; raw: Stored | null } | null>(null);
  const roles = useMemo(() => new RoleSet(list.settings.roles), [list.settings.roles]);
  const ops = useListOps({
    list,
    flag: 'published',
    noun: 'project',
    titleOf: (item) => view(item).title,
    filesOf: (item) => mediaPaths(view(item)),
  });

  // the live preview shows what is saved
  useDraftSync('projects', list.items, !list.loading && !list.loadError);

  if (list.loadError) return <AdminLoadError message={list.loadError} />;
  if (list.loading) {
    return (
      <div className="flex items-center justify-center py-12" role="status" aria-label="Loading projects">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const projects = list.items;

  const edit = (item: Stored) => {
    const draft = view(item);
    if (typeof item.title !== 'string' || !item.title.trim()) draft.title = '';
    setEditing({ draft, raw: item });
  };

  const add = () => {
    const next = Math.max(0, ...projects.map((p) => Number(p.id) || 0)) + 1;
    setEditing({ draft: blank(next), raw: null });
  };

  if (editing) {
    return (
      <ProjectEditor
        key={String(editing.draft.id)}
        initial={editing.draft}
        raw={editing.raw}
        roles={roles}
        copy={list.settings.copy}
        apply={list.apply}
        categories={Array.from(
          new Set([
            ...CATEGORY_SUGGESTIONS,
            ...projects.map((p) => (typeof p.category === 'string' ? p.category : '')).filter(Boolean),
          ])
        )}
        onClose={() => setEditing(null)}
      />
    );
  }

  return (
    <div className="max-w-5xl space-y-6 pb-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          icon={FolderKanban}
          title="Projects and case studies"
          subtitle="Add a project, write its story, upload pictures, and publish it when it is ready"
        />
        <button type="button" onClick={add} className={primaryButtonClass}>
          <Plus size={16} aria-hidden="true" />
          Add a project
        </button>
      </div>

      {projects.length === 0 && (
        <Panel>
          <p className="text-sm text-gray-600">
            No projects yet. Select &quot;Add a project&quot; to write your first one.
          </p>
        </Panel>
      )}

      <ul className="space-y-4">
        {projects.map((item, index) => {
          const project = view(item);
          const published = ops.isPublished(item);
          const written = writtenSections(project).length;
          const pictures = (project.media?.length ?? 0) + (project.images?.length ?? 0);
          return (
            <li
              key={idOf(item) || index}
              className={`rounded-xl border p-4 shadow-sm sm:p-5 ${published ? 'border-gray-200 bg-white' : 'border-amber-300 bg-amber-50/50'}`}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold break-words text-gray-900">{project.title}</h2>
                    {project.featured && (
                      <Star
                        size={16}
                        className="fill-yellow-400 text-yellow-500"
                        role="img"
                        aria-label="Featured"
                      />
                    )}
                    <StatusBadge published={published} />
                    {project.year && <span className="text-sm text-gray-500">{project.year}</span>}
                  </div>
                  {project.subtitle && (
                    <p className="text-sm font-medium text-purple-700">{project.subtitle}</p>
                  )}
                  <p className="mt-1 line-clamp-2 text-sm text-gray-600">{project.description}</p>
                  <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
                    <span>
                      Case study: {written} of {CASE_SECTION_DEFS.length} parts written
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <ImageIcon size={12} aria-hidden="true" />
                      {pictures} picture{pictures === 1 ? '' : 's'}
                    </span>
                    {!hasCaseStudy(project) && (
                      <span className="text-amber-800">Only the card text so far</span>
                    )}
                  </p>
                </div>

                <RowActions
                  name={project.title}
                  index={index}
                  count={projects.length}
                  published={published}
                  busy={ops.busyId === idOf(item)}
                  viewHref={`/?project=${encodeURIComponent(idOf(item))}`}
                  onMove={(direction) => ops.move(index, direction)}
                  onToggle={() => ops.toggle(item)}
                  onEdit={() => edit(item)}
                  onDelete={() => ops.remove(item)}
                />
              </div>
            </li>
          );
        })}
      </ul>
      <p className={hintClass}>
        The order here is the order on your site. Featured projects are always shown first there.
      </p>
    </div>
  );
}

interface EditorProps {
  initial: Project;
  raw: Stored | null;
  roles: RoleSet;
  copy: Record<string, string>;
  categories: string[];
  apply: (change: (latest: Stored[]) => Stored[]) => Promise<Stored[] | null>;
  onClose: () => void;
}

function ProjectEditor({ initial, raw, roles, copy, categories, apply, onClose }: EditorProps) {
  const notify = useNotify();
  const confirm = useConfirm();
  const { draft, set, dirty, saved, markSaved, close, ledger } = useEditor<Project>({
    initial,
    exists: Boolean(raw),
    filesOf: mediaPaths,
    onClose,
  });
  const [tab, setTab] = useState<Tab>('basics');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  // the parts of the case study that start open: the first two, and any that already have text
  const [openAtStart] = useState(
    () =>
      new Set(
        CASE_SECTION_DEFS.filter(
          (def, index) => index < 2 || hasText(initial[def.key])
        ).map((def) => def.key)
      )
  );
  const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({
    basics: null,
    story: null,
    media: null,
  });

  const t = useMemo(() => makeTranslate(copy), [copy]);
  const published = draft.published !== false;

  const validate = (): Record<string, string> => {
    const problems: Record<string, string> = {};
    if (!draft.title.trim()) problems.title = 'Give the project a title.';
    if (draft.githubUrl?.trim() && !toWebUrl(draft.githubUrl)) {
      problems.githubUrl =
        'This does not look like a web address, for example https://github.com/you/project.';
    }
    if (draft.liveUrl?.trim() && !toWebUrl(draft.liveUrl)) {
      problems.liveUrl =
        'This does not look like a web address, for example https://your-app.streamlit.app.';
    }
    if (draft.year?.trim() && !/(19|20)\d{2}/.test(draft.year)) {
      problems.year = 'Include a four-digit year, such as 2025.';
    }
    return problems;
  };

  // `publish` sets whether the project is visible; leaving it out keeps the choice made in the form
  const save = async (publish?: boolean) => {
    const problems = validate();
    setErrors(problems);
    const firstProblem = Object.keys(problems)[0];
    if (firstProblem) {
      setTab('basics');
      requestAnimationFrame(() => document.getElementById(`project-${firstProblem}`)?.focus());
      notify.error('Some details need your attention. They are marked in red.');
      return;
    }

    const snapshot: Project = { ...draft, published: publish ?? draft.published !== false };
    const clean: Stored = {
      ...snapshot,
      title: snapshot.title.trim(),
      subtitle: snapshot.subtitle?.trim() ?? '',
      description: snapshot.description.trim(),
      githubUrl: toWebUrl(snapshot.githubUrl),
      liveUrl: toWebUrl(snapshot.liveUrl),
      category: snapshot.category?.trim() ?? '',
      year: snapshot.year?.trim() ?? '',
      keyFeatures: (snapshot.keyFeatures ?? []).map((line) => line.trim()).filter(Boolean),
      metrics: (snapshot.metrics ?? [])
        .map((m) => ({ label: m.label.trim(), value: m.value.trim() }))
        .filter((m) => m.label && m.value),
      sections: (snapshot.sections ?? []).filter((s) => s.title.trim() || s.body.trim()),
      images: (snapshot.images ?? []).map((address) => toWebUrl(address)).filter(Boolean),
      teamSize: snapshot.teamSize || undefined,
      tracks: snapshot.tracks && snapshot.tracks.length > 0 ? snapshot.tracks : undefined,
    };

    setSaving(true);
    const result = await apply((latest) => {
      const index = latest.findIndex((p) => idOf(p) === String(snapshot.id));
      if (index >= 0) {
        const next = [...latest];
        next[index] = { ...latest[index], ...clean };
        return next;
      }
      return [...latest, { ...(raw ?? {}), ...clean }];
    });
    setSaving(false);

    if (!result) {
      notify.error(
        'Your changes could not be saved. Nothing is lost: it is all still on this page. Please try again.'
      );
      return;
    }
    // the saved version of the entry becomes what is on the page (the publish choice may have come from the button)
    set('published', snapshot.published);
    await markSaved(snapshot);
    notify.success(
      snapshot.published !== false
        ? 'Saved. This project is live on your site.'
        : 'Saved as a draft. Visitors cannot see it yet.'
    );
  };

  const mediaCount = (draft.media?.length ?? 0) + (draft.images?.length ?? 0);
  const tabs: { id: Tab; label: string }[] = [
    { id: 'basics', label: 'Basics' },
    { id: 'story', label: 'Case study' },
    { id: 'media', label: `Pictures and visuals (${mediaCount})` },
  ];

  // arrow keys move between the tabs, as in any tab list
  const onTabKey = (event: React.KeyboardEvent, index: number) => {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!step && event.key !== 'Home' && event.key !== 'End') return;
    event.preventDefault();
    const target =
      event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + step + tabs.length) % tabs.length;
    setTab(tabs[target].id);
    tabRefs.current[tabs[target].id]?.focus();
  };

  const sections = draft.sections ?? [];
  const updateSection = (id: string, change: Partial<CaseStudySection>) =>
    set(
      'sections',
      sections.map((s) => (s.id === id ? { ...s, ...change } : s))
    );
  const moveSection = (index: number, direction: -1 | 1) => {
    const next = [...sections];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    set('sections', next);
  };
  const metrics = draft.metrics ?? [];

  return (
    <div className="space-y-6 pb-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          icon={FolderKanban}
          title={saved.exists ? `Edit: ${initial.title || 'project'}` : 'New project'}
          subtitle="Everything here can be changed later. Only published projects appear on your site."
        />
        <button type="button" onClick={() => setPreviewing(true)} className={buttonClass}>
          <Eye size={16} aria-hidden="true" />
          Preview the project window
        </button>
      </div>

      <div
        role="tablist"
        aria-label="Parts of the project"
        className="flex flex-wrap gap-2 border-b border-gray-200 pb-3"
      >
        {tabs.map((item, index) => (
          <button
            key={item.id}
            ref={(element) => {
              tabRefs.current[item.id] = element;
            }}
            type="button"
            role="tab"
            id={`tab-${item.id}`}
            aria-selected={tab === item.id}
            aria-controls={`panel-${item.id}`}
            tabIndex={tab === item.id ? 0 : -1}
            onClick={() => setTab(item.id)}
            onKeyDown={(event) => onTabKey(event, index)}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === item.id ? 'bg-purple-600 text-white' : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {Object.keys(errors).length > 0 && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          Please fix: {Object.values(errors).join(' ')}
        </div>
      )}

      {/* All three panels stay in the page (the other two are hidden), so nothing typed or opened is lost when switching */}
      <div
        role="tabpanel"
        id="panel-basics"
        aria-labelledby="tab-basics"
        hidden={tab !== 'basics'}
        className="max-w-4xl space-y-6"
      >
        <Panel title="The card on your homepage" description="What visitors see before they select View more.">
          <div>
            <label htmlFor="project-title" className={labelClass}>
              Title *
            </label>
            <input
              id="project-title"
              type="text"
              value={draft.title}
              onChange={(e) => set('title', e.target.value)}
              maxLength={120}
              aria-invalid={Boolean(errors.title)}
              aria-describedby={errors.title ? 'err-title' : undefined}
              className={inputClass}
            />
            <FieldError id="err-title" message={errors.title} />
          </div>
          <div>
            <label htmlFor="project-subtitle" className={labelClass}>
              Tagline
            </label>
            <input
              id="project-subtitle"
              type="text"
              value={draft.subtitle ?? ''}
              onChange={(e) => set('subtitle', e.target.value)}
              maxLength={160}
              className={inputClass}
              placeholder="A one-line description"
            />
          </div>
          <div>
            <label htmlFor="project-description" className={labelClass}>
              Short summary
            </label>
            <textarea
              id="project-description"
              rows={4}
              value={draft.description}
              onChange={(e) => set('description', e.target.value)}
              maxLength={900}
              className={`${inputClass} resize-y`}
            />
            <p className={hintClass}>Two or three sentences. The full story goes in the Case study tab.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="project-category" className={labelClass}>
                Category
              </label>
              <input
                id="project-category"
                list="project-categories"
                type="text"
                value={draft.category ?? ''}
                onChange={(e) => set('category', e.target.value)}
                maxLength={60}
                className={inputClass}
              />
              <datalist id="project-categories">
                {categories.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>
            <div>
              <label htmlFor="project-year" className={labelClass}>
                Year
              </label>
              <input
                id="project-year"
                type="text"
                inputMode="numeric"
                value={draft.year ?? ''}
                onChange={(e) => set('year', e.target.value)}
                aria-invalid={Boolean(errors.year)}
                aria-describedby={errors.year ? 'err-year' : undefined}
                className={inputClass}
              />
              <FieldError id="err-year" message={errors.year} />
            </div>
            <div>
              <label htmlFor="project-status" className={labelClass}>
                Status
              </label>
              <select
                id="project-status"
                value={draft.status || 'completed'}
                onChange={(e) => set('status', e.target.value)}
                className={inputClass}
              >
                <option value="completed">Completed</option>
                <option value="in-progress">In progress</option>
                <option value="planned">Planned</option>
              </select>
            </div>
          </div>
          <Toggle
            checked={Boolean(draft.featured)}
            onChange={(value) => set('featured', value)}
            label="Featured project"
            description="Featured projects are shown first on your site."
          />
        </Panel>

        <Panel title="Technologies, tools and roles">
          <TagsInput
            id="project-technologies"
            label="Technologies"
            hint="Separate with commas. They feed the technology map, the filters and the skill explorer."
            value={draft.technologies}
            onChange={(value) => set('technologies', value)}
            placeholder="Python, Pandas, scikit-learn"
          />
          <TagsInput
            id="project-tools"
            label="Other tools"
            hint="Software and services that are not programming technologies, for example Power BI, Git or Docker."
            value={draft.tools ?? []}
            onChange={(value) => set('tools', value)}
          />
          {roles.list.length > 0 && (
            <fieldset>
              <legend className={labelClass}>Roles this project shows</legend>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {roles.list.map((role) => (
                  <label key={role.id} className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={draft.tracks?.includes(role.id) ?? false}
                      onChange={(e) =>
                        set(
                          'tracks',
                          e.target.checked
                            ? [...(draft.tracks ?? []), role.id]
                            : (draft.tracks ?? []).filter((id) => id !== role.id)
                        )
                      }
                      className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    {role.label}
                  </label>
                ))}
              </div>
              <p className={hintClass}>Leave all unticked and the roles are worked out from the technologies.</p>
            </fieldset>
          )}
        </Panel>

        <Panel title="Links">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="project-githubUrl" className={labelClass}>
                GitHub repository
              </label>
              <input
                id="project-githubUrl"
                type="text"
                value={draft.githubUrl ?? ''}
                onChange={(e) => set('githubUrl', e.target.value)}
                aria-invalid={Boolean(errors.githubUrl)}
                aria-describedby={errors.githubUrl ? 'err-githubUrl' : undefined}
                className={inputClass}
                placeholder="https://github.com/you/project"
              />
              <FieldError id="err-githubUrl" message={errors.githubUrl} />
            </div>
            <div>
              <label htmlFor="project-liveUrl" className={labelClass}>
                Live demo
              </label>
              <input
                id="project-liveUrl"
                type="text"
                value={draft.liveUrl ?? ''}
                onChange={(e) => set('liveUrl', e.target.value)}
                aria-invalid={Boolean(errors.liveUrl)}
                aria-describedby={errors.liveUrl ? 'err-liveUrl' : undefined}
                className={inputClass}
                placeholder="https://your-app.streamlit.app"
              />
              <FieldError id="err-liveUrl" message={errors.liveUrl} />
            </div>
          </div>
          <Toggle
            checked={Boolean(draft.embedLive)}
            onChange={(value) => set('embedLive', value)}
            label="Show the live demo inside the project window"
            description="Adds a button that opens your running app in a frame. It only works when the app allows being shown inside other sites (Streamlit apps usually do)."
          />
        </Panel>

        <Panel title="Publishing">
          <Toggle
            checked={published}
            onChange={(value) => set('published', value)}
            label="Visible on my site"
            description={
              published
                ? 'Visitors can see this project and its pictures.'
                : 'A draft: only you can see it, and its pictures stay private too.'
            }
          />
        </Panel>
      </div>

      <div
        role="tabpanel"
        id="panel-story"
        aria-labelledby="tab-story"
        hidden={tab !== 'story'}
        className="max-w-4xl space-y-6"
      >
        <Panel>
          <p className="text-sm text-gray-600">
            Write the story of the project in your own words.{' '}
            <strong>Only the parts you fill in appear</strong> on your site. Nothing is added for the
            parts you leave empty. Use the buttons above each box to format the text, and its Preview
            tab to see how it will look.
          </p>
        </Panel>

        {CASE_SECTION_DEFS.map((def) => {
          const written = hasText(draft[def.key]);
          return (
            <details
              key={def.key}
              open={openAtStart.has(def.key)}
              className="rounded-xl border border-gray-200 bg-white shadow-sm"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 sm:px-6">
                <span className="font-semibold text-gray-900">{def.label}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${written ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}
                >
                  {written ? 'Written' : 'Empty'}
                </span>
              </summary>
              <div className="border-t border-gray-100 p-4 sm:p-6">
                <MarkdownEditor
                  id={`project-${def.key}`}
                  label={def.label}
                  hint={def.hint}
                  value={draft[def.key] ?? ''}
                  onChange={(value) => set(def.key, value)}
                  media={draft.media}
                  rows={def.rows}
                />
              </div>
            </details>
          );
        })}

        <Panel title="Key features" description="Short points, one per line. They appear as a tidy list.">
          <textarea
            aria-label="Key features, one per line"
            rows={5}
            value={(draft.keyFeatures ?? []).join('\n')}
            onChange={(e) => set('keyFeatures', e.target.value.split('\n'))}
            className={`${inputClass} resize-y`}
          />
        </Panel>

        <Panel
          title="Numbers"
          description="Measurable results, for example 92% accuracy or 120 ms response time. Leave empty if you have none: nothing is made up."
        >
          <div className="space-y-2">
            {metrics.map((metric, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  aria-label={`Number ${index + 1}: value`}
                  value={metric.value}
                  maxLength={24}
                  onChange={(e) =>
                    set(
                      'metrics',
                      metrics.map((m, i) => (i === index ? { ...m, value: e.target.value } : m))
                    )
                  }
                  className={`${inputClass} !w-32 shrink-0`}
                  placeholder="92%"
                />
                <input
                  type="text"
                  aria-label={`Number ${index + 1}: what it measures`}
                  value={metric.label}
                  maxLength={40}
                  onChange={(e) =>
                    set(
                      'metrics',
                      metrics.map((m, i) => (i === index ? { ...m, label: e.target.value } : m))
                    )
                  }
                  className={inputClass}
                  placeholder="Accuracy"
                />
                <button
                  type="button"
                  onClick={() =>
                    set(
                      'metrics',
                      metrics.filter((_, i) => i !== index)
                    )
                  }
                  className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"
                  aria-label={`Remove number ${index + 1}`}
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => set('metrics', [...metrics, { label: '', value: '' }])}
              disabled={metrics.length >= 9}
              className={buttonClass}
            >
              <Plus size={16} aria-hidden="true" />
              Add a number
            </button>
          </div>
        </Panel>

        <Panel title="Project facts" description="Small details shown beside the story.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="project-role" className={labelClass}>
                My role
              </label>
              <input
                id="project-role"
                type="text"
                value={draft.role ?? ''}
                onChange={(e) => set('role', e.target.value)}
                className={inputClass}
                placeholder="Solo developer"
              />
            </div>
            <div>
              <label htmlFor="project-teamSize" className={labelClass}>
                Team size
              </label>
              <input
                id="project-teamSize"
                type="number"
                min={0}
                value={draft.teamSize ?? ''}
                onChange={(e) => set('teamSize', Number(e.target.value) || undefined)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="project-startDate" className={labelClass}>
                Started
              </label>
              <input
                id="project-startDate"
                type="text"
                value={draft.startDate ?? ''}
                onChange={(e) => set('startDate', e.target.value)}
                className={inputClass}
                placeholder="January 2025"
              />
            </div>
            <div>
              <label htmlFor="project-endDate" className={labelClass}>
                Finished
              </label>
              <input
                id="project-endDate"
                type="text"
                value={draft.endDate ?? ''}
                onChange={(e) => set('endDate', e.target.value)}
                className={inputClass}
                placeholder="March 2025"
              />
            </div>
          </div>
        </Panel>

        <Panel
          title="Extra sections"
          description="Your own headings, for anything the parts above do not cover, for example Model evaluation, Deployment or Dashboard walkthrough."
        >
          <div className="space-y-4">
            {sections.map((section, index) => (
              <div key={section.id} className="space-y-3 rounded-xl border border-gray-200 p-4">
                <div className="flex items-end gap-2">
                  <div className="min-w-0 flex-1">
                    <label htmlFor={`extra-title-${section.id}`} className={labelClass}>
                      Heading
                    </label>
                    <input
                      id={`extra-title-${section.id}`}
                      type="text"
                      value={section.title}
                      maxLength={100}
                      onChange={(e) => updateSection(section.id, { title: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => moveSection(index, -1)}
                    disabled={index === 0}
                    className={`${buttonClass} !px-2`}
                    aria-label={`Move the section "${section.title || 'untitled'}" up`}
                  >
                    <ArrowUp size={16} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSection(index, 1)}
                    disabled={index === sections.length - 1}
                    className={`${buttonClass} !px-2`}
                    aria-label={`Move the section "${section.title || 'untitled'}" down`}
                  >
                    <ArrowDown size={16} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (
                        hasText(section.body) &&
                        !(await confirm({
                          title: 'Remove this section?',
                          message: `"${section.title || 'Untitled section'}" and its text are removed when you save.`,
                          confirmLabel: 'Remove section',
                          danger: true,
                        }))
                      ) {
                        return;
                      }
                      set(
                        'sections',
                        sections.filter((s) => s.id !== section.id)
                      );
                    }}
                    className={`${buttonClass} !px-2 text-red-600`}
                    aria-label={`Remove the section "${section.title || 'untitled'}"`}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>
                <MarkdownEditor
                  id={`extra-body-${section.id}`}
                  label="Text"
                  value={section.body}
                  onChange={(value) => updateSection(section.id, { body: value })}
                  media={draft.media}
                  rows={6}
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                set('sections', [
                  ...sections,
                  { id: `section-${Date.now().toString(36)}`, title: '', body: '' },
                ])
              }
              disabled={sections.length >= 12}
              className={buttonClass}
            >
              <Plus size={16} aria-hidden="true" />
              Add a section
            </button>
          </div>
        </Panel>
      </div>

      <div
        role="tabpanel"
        id="panel-media"
        aria-labelledby="tab-media"
        hidden={tab !== 'media'}
        className="max-w-4xl space-y-6"
      >
        <Panel
          title="Pictures, screenshots, charts and diagrams"
          description="Upload as many as you like and say what each one shows. A project with dashboards or screenshots opens with the pictures first; charts and diagrams sit with the story."
        >
          <MediaListEditor
            items={draft.media ?? []}
            onChange={(items) => set('media', items)}
            kind="project"
            ledger={ledger}
            label="Pictures"
            help="Drop several files at once. You can also place any picture inside your text from the Case study tab."
            kinds={MEDIA_KINDS}
          />
        </Panel>
        <Panel
          title="Pictures hosted elsewhere"
          description="Addresses of pictures that are already online, one per line. Uploading is better: uploaded pictures stay under your control."
        >
          <textarea
            aria-label="Picture addresses, one per line"
            rows={3}
            value={(draft.images ?? []).join('\n')}
            onChange={(e) => set('images', e.target.value.split('\n'))}
            placeholder="https://..."
            className={`${inputClass} resize-y`}
          />
        </Panel>
      </div>

      <EditorBar published={published} saving={saving} dirty={dirty} onSave={save} onClose={close} />

      <Modal
        open={previewing}
        onClose={() => setPreviewing(false)}
        size="xl"
        fullOnMobile
        title={draft.title || 'Untitled project'}
        description={draft.subtitle || 'Preview: this is how visitors will see it when they select View more'}
      >
        {previewing && <CaseStudyBody project={draft} roles={roles} t={t} />}
      </Modal>
    </div>
  );
}
