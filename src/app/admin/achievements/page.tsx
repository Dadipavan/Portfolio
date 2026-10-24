'use client';

import { useState } from 'react';
import { Plus, Trash2, Trophy } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import AdminLoadError from '@/components/AdminLoadError';
import { useNotify } from '@/components/admin/Feedback';
import {
  FieldError,
  PageHeader,
  Panel,
  Toggle,
  buttonClass,
  hintClass,
  inputClass,
  labelClass,
  primaryButtonClass,
} from '@/components/admin/kit';
import { EditorBar, RowActions, StatusBadge } from '@/components/admin/ListParts';
import MarkdownEditor from '@/components/admin/MarkdownEditor';
import { FileThumb, MediaListEditor } from '@/components/admin/MediaEditors';
import { useEditor } from '@/components/admin/useEditor';
import { idOf, useListOps } from '@/components/admin/useListOps';
import { normaliseAchievements } from '@/lib/normalize';
import { useDraftSync } from '@/lib/previewBus';
import type { Achievement, AchievementCategory, ProfileLink } from '@/lib/types';
import { toWebUrl } from '@/lib/url';
import { newItemId, useStoredList } from '@/lib/useStoredList';

type Stored = Record<string, unknown>;

const CATEGORIES: { value: AchievementCategory; label: string }[] = [
  { value: 'award', label: 'Award' },
  { value: 'hackathon', label: 'Hackathon' },
  { value: 'competition', label: 'Competition' },
  { value: 'research', label: 'Research' },
  { value: 'milestone', label: 'Milestone' },
  { value: 'recognition', label: 'Recognition' },
  { value: 'other', label: 'Other' },
];

const SUMMARY_LIMIT = 600;
const MAX_LINKS = 10;

const blank = (): Achievement => ({
  id: newItemId(),
  title: '',
  description: '',
  background: '',
  date: '',
  organization: '',
  category: 'award',
  impact: '',
  links: [],
  media: [],
  published: false,
});

const mediaPaths = (item: Achievement) => (item.media ?? []).map((file) => file.path);

// A saved achievement as the list and the editor work with it. Entries saved without a title are still shown, so they
// can be edited or deleted.
function view(item: Stored): Achievement {
  const title =
    typeof item.title === 'string' && item.title.trim() ? item.title : '(Untitled achievement)';
  const achievement = normaliseAchievements([{ ...item, title }])[0];
  return { ...achievement, id: item.id as string | number | undefined };
}

export default function AchievementsAdmin() {
  return (
    <AdminLayout>
      <AchievementsContent />
    </AdminLayout>
  );
}

function AchievementsContent() {
  const list = useStoredList('achievements');
  const [editing, setEditing] = useState<{ draft: Achievement; raw: Stored | null } | null>(null);
  const ops = useListOps({
    list,
    flag: 'published',
    noun: 'achievement',
    titleOf: (item) => view(item).title,
    filesOf: (item) => mediaPaths(view(item)),
  });

  // the live preview shows what is saved
  useDraftSync('achievements', list.items, !list.loading && !list.loadError);

  if (list.loadError) return <AdminLoadError message={list.loadError} />;
  if (list.loading) {
    return (
      <div
        className="flex items-center justify-center py-12"
        role="status"
        aria-label="Loading achievements"
      >
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const achievements = list.items;

  const edit = (item: Stored) => {
    const draft = view(item);
    if (typeof item.title !== 'string' || !item.title.trim()) draft.title = '';
    setEditing({ draft, raw: item });
  };

  if (editing) {
    return (
      <AchievementEditor
        key={String(editing.draft.id)}
        initial={editing.draft}
        raw={editing.raw}
        apply={list.apply}
        onClose={() => setEditing(null)}
      />
    );
  }

  return (
    <div className="max-w-5xl space-y-6 pb-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          icon={Trophy}
          title="Achievements"
          subtitle="Awards, hackathons, competitions and milestones, each with its story, pictures and links"
        />
        <button
          type="button"
          onClick={() => setEditing({ draft: blank(), raw: null })}
          className={primaryButtonClass}
        >
          <Plus size={16} aria-hidden="true" />
          Add an achievement
        </button>
      </div>

      {achievements.length === 0 && (
        <Panel>
          <p className="text-sm text-gray-600">
            No achievements yet. Select &quot;Add an achievement&quot; to add your first one.
          </p>
        </Panel>
      )}

      <ul className="space-y-4">
        {achievements.map((item, index) => {
          const achievement = view(item);
          const published = ops.isPublished(item);
          const cover = (achievement.media ?? []).find((file) => file.mime.startsWith('image/'));
          const label = CATEGORIES.find((c) => c.value === achievement.category)?.label;
          const meta = [achievement.organization, achievement.date].filter(Boolean).join(' · ');
          return (
            <li
              key={idOf(item) || index}
              className={`rounded-xl border p-4 shadow-sm sm:p-5 ${published ? 'border-gray-200 bg-white' : 'border-amber-300 bg-amber-50/50'}`}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                {cover && <FileThumb file={cover} className="h-24 w-36" />}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold break-words text-gray-900">
                      {achievement.title}
                    </h2>
                    <StatusBadge published={published} />
                    {label && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                        {label}
                      </span>
                    )}
                  </div>
                  {meta && <p className="text-sm font-medium text-purple-700">{meta}</p>}
                  {achievement.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                      {achievement.description}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-gray-600">
                    {achievement.media?.length ?? 0} file
                    {(achievement.media?.length ?? 0) === 1 ? '' : 's'} ·{' '}
                    {achievement.links?.length ?? 0} link
                    {(achievement.links?.length ?? 0) === 1 ? '' : 's'}
                  </p>
                </div>
                <RowActions
                  name={achievement.title}
                  index={index}
                  count={achievements.length}
                  published={published}
                  busy={ops.busyId === idOf(item)}
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
        The order here is the order on your site. Visitors can filter by category when there is
        more than one.
      </p>
    </div>
  );
}

interface EditorProps {
  initial: Achievement;
  raw: Stored | null;
  apply: (change: (latest: Stored[]) => Stored[]) => Promise<Stored[] | null>;
  onClose: () => void;
}

function AchievementEditor({ initial, raw, apply, onClose }: EditorProps) {
  const notify = useNotify();
  const { draft, set, dirty, saved, markSaved, close, ledger } = useEditor<Achievement>({
    initial,
    exists: Boolean(raw),
    filesOf: mediaPaths,
    onClose,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const published = draft.published !== false;
  const links = draft.links ?? [];

  const setLink = (index: number, change: Partial<ProfileLink>) =>
    set(
      'links',
      links.map((link, i) => (i === index ? { ...link, ...change } : link))
    );

  const validate = (): Record<string, string> => {
    const problems: Record<string, string> = {};
    if (!draft.title.trim()) problems.title = 'Give the achievement a title.';
    const badLink = links.findIndex((link) => link.url.trim() && !toWebUrl(link.url));
    if (badLink >= 0) {
      problems[`link-${badLink}-url`] =
        `Link ${badLink + 1} does not look like a web address, for example https://example.com.`;
    }
    return problems;
  };

  // `publish` sets whether the achievement is shown; leaving it out keeps the choice made in the form
  const save = async (publish?: boolean) => {
    const problems = validate();
    setErrors(problems);
    const firstProblem = Object.keys(problems)[0];
    if (firstProblem) {
      requestAnimationFrame(() => document.getElementById(`ach-${firstProblem}`)?.focus());
      notify.error('Some details need your attention. They are marked in red.');
      return;
    }

    const snapshot: Achievement = { ...draft, published: publish ?? draft.published !== false };
    const clean: Stored = {
      id: snapshot.id,
      title: snapshot.title.trim(),
      description: snapshot.description.trim(),
      background: (snapshot.background ?? '').trim(),
      date: (snapshot.date ?? '').trim(),
      organization: (snapshot.organization ?? '').trim(),
      category: snapshot.category,
      impact: (snapshot.impact ?? '').trim(),
      // a link needs both a label and an address; a half-filled one is left out
      links: (snapshot.links ?? [])
        .map((link) => ({ label: link.label.trim(), url: toWebUrl(link.url) }))
        .filter((link) => link.label && link.url),
      media: snapshot.media ?? [],
      published: snapshot.published !== false,
    };

    setSaving(true);
    const result = await apply((latest) => {
      const index = latest.findIndex((entry) => idOf(entry) === String(snapshot.id));
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
    set('published', snapshot.published);
    await markSaved(snapshot);
    notify.success(
      snapshot.published !== false
        ? 'Saved. This achievement is shown on your site.'
        : 'Saved as a draft. Visitors cannot see it yet.'
    );
  };

  return (
    <div className="space-y-6 pb-4">
      <PageHeader
        icon={Trophy}
        title={saved.exists ? `Edit: ${initial.title || 'achievement'}` : 'New achievement'}
        subtitle="Only published achievements, and their files, can be seen by visitors."
      />

      {Object.keys(errors).length > 0 && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
        >
          Please fix: {Object.values(errors).join(' ')}
        </div>
      )}

      <div className="max-w-4xl space-y-6">
        <Panel title="The card" description="What visitors see in the list, before they open the details.">
          <div>
            <label htmlFor="ach-title" className={labelClass}>
              Title *
            </label>
            <input
              id="ach-title"
              type="text"
              value={draft.title}
              maxLength={140}
              onChange={(e) => set('title', e.target.value)}
              aria-invalid={Boolean(errors.title)}
              aria-describedby={errors.title ? 'err-ach-title' : undefined}
              className={inputClass}
              placeholder="Winner, State-level hackathon"
            />
            <FieldError id="err-ach-title" message={errors.title} />
          </div>
          <div>
            <label htmlFor="ach-description" className={labelClass}>
              Short summary
            </label>
            <textarea
              id="ach-description"
              rows={3}
              value={draft.description}
              maxLength={SUMMARY_LIMIT}
              onChange={(e) => set('description', e.target.value)}
              className={`${inputClass} resize-y`}
            />
            <p className={hintClass}>One or two sentences. The full story goes below.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="ach-category" className={labelClass}>
                Category
              </label>
              <select
                id="ach-category"
                value={draft.category ?? 'other'}
                onChange={(e) => set('category', e.target.value as AchievementCategory)}
                className={inputClass}
              >
                {CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="ach-organization" className={labelClass}>
                Given by, or held at
              </label>
              <input
                id="ach-organization"
                type="text"
                value={draft.organization ?? ''}
                maxLength={120}
                onChange={(e) => set('organization', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="ach-date" className={labelClass}>
                Date
              </label>
              <input
                id="ach-date"
                type="text"
                value={draft.date ?? ''}
                maxLength={40}
                onChange={(e) => set('date', e.target.value)}
                className={inputClass}
                placeholder="October 2025"
              />
            </div>
          </div>
        </Panel>

        <Panel
          title="The full story"
          description="Optional. Only the parts you write are shown, and nothing is added for the parts you leave empty."
        >
          <MarkdownEditor
            id="ach-background"
            label="Background"
            hint="What the event or award was, and what you did."
            value={draft.background ?? ''}
            onChange={(value) => set('background', value)}
            media={draft.media}
            rows={6}
          />
          <MarkdownEditor
            id="ach-impact"
            label="Impact"
            hint="Why it matters: what it led to, or what it showed."
            value={draft.impact ?? ''}
            onChange={(value) => set('impact', value)}
            media={draft.media}
            rows={5}
          />
        </Panel>

        <Panel
          title="Photos and documents"
          description="Photos, certificates, letters or slides. Pictures appear in the gallery; PDFs appear as files to open or download."
        >
          <MediaListEditor
            items={draft.media ?? []}
            onChange={(items) => set('media', items)}
            kind="achievement"
            ledger={ledger}
            label="Files"
            max={20}
          />
        </Panel>

        <Panel title="Links" description="For example the event page, a news article, or your submission.">
          <div className="space-y-3">
            {links.map((link, index) => (
              <div key={index} className="space-y-1">
                <div className="flex flex-wrap items-start gap-2 sm:flex-nowrap">
                  <input
                    type="text"
                    aria-label={`Link ${index + 1}: label`}
                    value={link.label}
                    maxLength={30}
                    onChange={(e) => setLink(index, { label: e.target.value })}
                    className={`${inputClass} sm:!w-48 sm:shrink-0`}
                    placeholder="Event page"
                  />
                  <input
                    id={`ach-link-${index}-url`}
                    type="text"
                    aria-label={`Link ${index + 1}: web address`}
                    value={link.url}
                    onChange={(e) => setLink(index, { url: e.target.value })}
                    aria-invalid={Boolean(errors[`link-${index}-url`])}
                    aria-describedby={
                      errors[`link-${index}-url`] ? `err-ach-link-${index}` : undefined
                    }
                    className={inputClass}
                    placeholder="https://..."
                  />
                  <button
                    type="button"
                    onClick={() =>
                      set(
                        'links',
                        links.filter((_, i) => i !== index)
                      )
                    }
                    className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"
                    aria-label={`Remove link ${index + 1}`}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>
                <FieldError id={`err-ach-link-${index}`} message={errors[`link-${index}-url`]} />
              </div>
            ))}
            <button
              type="button"
              onClick={() => set('links', [...links, { label: '', url: '' }])}
              disabled={links.length >= MAX_LINKS}
              className={buttonClass}
            >
              <Plus size={16} aria-hidden="true" />
              Add a link
            </button>
          </div>
        </Panel>

        <Panel title="Publishing">
          <Toggle
            checked={published}
            onChange={(value) => set('published', value)}
            label="Show on my site"
            description={
              published
                ? 'Visitors can see this achievement and its files.'
                : 'A draft: only you can see it, and its files stay private.'
            }
          />
        </Panel>
      </div>

      <EditorBar published={published} saving={saving} dirty={dirty} onSave={save} onClose={close} />
    </div>
  );
}
