'use client';

import { useState } from 'react';
import { Images, Plus, Sparkles } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import AdminLoadError from '@/components/AdminLoadError';
import { useNotify } from '@/components/admin/Feedback';
import {
  FieldError,
  PageBanner,
  PageHeader,
  Panel,
  Toggle,
  hintClass,
  inputClass,
  labelClass,
  primaryButtonClass,
} from '@/components/admin/kit';
import { EditorBar, RowActions, StatusBadge } from '@/components/admin/ListParts';
import { FileThumb, SingleFileEditor } from '@/components/admin/MediaEditors';
import { useEditor } from '@/components/admin/useEditor';
import { idOf, useListOps } from '@/components/admin/useListOps';
import { normaliseMoments } from '@/lib/normalize';
import { useDraftSync } from '@/lib/previewBus';
import type { Moment, MomentFrequency } from '@/lib/types';
import { toWebUrl } from '@/lib/url';
import { newItemId, useStoredList } from '@/lib/useStoredList';

type Stored = Record<string, unknown>;

const FREQUENCIES: { value: MomentFrequency; label: string; help: string }[] = [
  { value: 'once', label: 'Once on each device', help: 'Recommended. A visitor sees it one time, then never again, unless you edit it.' },
  { value: 'session', label: 'Once on each visit', help: 'Shown again the next time they come back to the site.' },
  { value: 'daily', label: 'At most once a day', help: 'Shown again after 24 hours.' },
];

const blank = (): Moment => ({
  id: newItemId(),
  title: '',
  text: '',
  year: String(new Date().getFullYear()),
  strip: true,
  popup: { enabled: false, start: '', end: '', delay: 4, frequency: 'once' },
  published: false,
});

const imagePaths = (item: Moment) => (item.image ? [item.image.path] : []);

// A saved moment as the list and the editor work with it. Entries saved without a title are still shown.
function view(item: Stored): Moment {
  const title = typeof item.title === 'string' && item.title.trim() ? item.title : '(Untitled moment)';
  const moment = normaliseMoments([{ ...item, title }])[0];
  return { ...moment, id: item.id as string | number };
}

export default function MomentsAdmin() {
  return (
    <AdminLayout>
      <MomentsContent />
    </AdminLayout>
  );
}

function MomentsContent() {
  const list = useStoredList('moments');
  const [editing, setEditing] = useState<{ draft: Moment; raw: Stored | null } | null>(null);
  const ops = useListOps({
    list,
    flag: 'published',
    noun: 'moment',
    titleOf: (item) => view(item).title,
    filesOf: (item) => imagePaths(view(item)),
  });

  useDraftSync('moments', list.items, !list.loading && !list.loadError);

  if (list.loadError) return <AdminLoadError message={list.loadError} />;
  if (list.loading) {
    return (
      <div className="flex items-center justify-center py-12" role="status" aria-label="Loading moments">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const moments = list.items;

  const edit = (item: Stored) => {
    const draft = view(item);
    if (typeof item.title !== 'string' || !item.title.trim()) draft.title = '';
    setEditing({ draft, raw: item });
  };

  if (editing) {
    return (
      <MomentEditor
        key={String(editing.draft.id)}
        initial={editing.draft}
        raw={editing.raw}
        apply={list.apply}
        onClose={() => setEditing(null)}
      />
    );
  }

  const on = list.settings.features.moments;
  const popups = moments.filter((m) => view(m).popup.enabled && m.published !== false).length;

  return (
    <div className="max-w-5xl space-y-6 pb-8">
      <PageBanner
        icon={Images}
        title="Moments"
        subtitle="Pictures with a few words, shown by year on your site, and optional popups"
        chips={[
          `${moments.length} moment${moments.length === 1 ? '' : 's'}`,
          `${popups} popup${popups === 1 ? '' : 's'} set`,
          on ? 'Switched on' : 'Switched off',
        ]}
      >
        <button type="button" onClick={() => setEditing({ draft: blank(), raw: null })} className={primaryButtonClass}>
          <Plus size={16} aria-hidden="true" />
          Add a moment
        </button>
      </PageBanner>

      {!on && (
        <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Moments are switched off, so visitors see nothing yet.</p>
          <p className="mt-1">
            Add your moments, then switch the feature on in{' '}
            <a href="/admin/appearance" className="font-medium underline">
              Appearance &gt; Other features &gt; Moments
            </a>
            . Switching it off again hides the strip and every popup, and keeps what you wrote.
          </p>
        </div>
      )}

      {moments.length === 0 && (
        <Panel>
          <p className="text-sm text-gray-600">No moments yet. Select &quot;Add a moment&quot; to add your first one.</p>
        </Panel>
      )}

      <ul className="space-y-4">
        {moments.map((item, index) => {
          const moment = view(item);
          const published = ops.isPublished(item);
          return (
            <li
              key={idOf(item) || index}
              className={`rounded-2xl border p-4 shadow-sm sm:p-5 ${published ? 'border-gray-200/80 bg-white' : 'border-amber-300 bg-amber-50/50'}`}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                {moment.image ? (
                  <FileThumb file={moment.image} className="h-24 w-36" />
                ) : (
                  <span className="flex h-24 w-36 shrink-0 items-center justify-center rounded-lg border border-dashed border-gray-300 text-gray-400">
                    <Sparkles size={22} aria-hidden="true" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold break-words text-gray-900">{moment.title}</h2>
                    <StatusBadge published={published} />
                    {moment.year && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">{moment.year}</span>}
                  </div>
                  {moment.text && <p className="mt-1 line-clamp-2 text-sm text-gray-600">{moment.text}</p>}
                  <p className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className={`rounded-full px-2 py-0.5 ${moment.strip ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {moment.strip ? 'On the yearly strip' : 'Not on the strip'}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 ${moment.popup.enabled ? 'bg-purple-50 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
                      {moment.popup.enabled ? 'Popup on' : 'No popup'}
                    </span>
                  </p>
                </div>
                <RowActions
                  name={moment.title}
                  index={index}
                  count={moments.length}
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
      <p className={hintClass}>The order here is the order inside each year on your site. Newest years come first.</p>
    </div>
  );
}

interface EditorProps {
  initial: Moment;
  raw: Stored | null;
  apply: (change: (latest: Stored[]) => Stored[]) => Promise<Stored[] | null>;
  onClose: () => void;
}

function MomentEditor({ initial, raw, apply, onClose }: EditorProps) {
  const notify = useNotify();
  const { draft, set, dirty, saved, markSaved, close, ledger } = useEditor<Moment>({
    initial,
    exists: Boolean(raw),
    filesOf: imagePaths,
    onClose,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const published = draft.published !== false;
  const popup = draft.popup;
  const setPopup = (change: Partial<Moment['popup']>) => set('popup', { ...popup, ...change });

  const validate = (): Record<string, string> => {
    const problems: Record<string, string> = {};
    if (!draft.title.trim()) problems.title = 'Give the moment a title.';
    if (draft.year.trim() && !/^\d{4}$/.test(draft.year.trim())) problems.year = 'The year is four digits, for example 2026.';
    if (draft.link && draft.link.url.trim() && !toWebUrl(draft.link.url)) problems.link = 'The link does not look like a web address, for example https://example.com.';
    if (popup.start && popup.end && popup.end < popup.start) problems.end = 'The last day cannot be before the first day.';
    if (popup.enabled && !draft.text.trim() && !draft.image) problems.popup = 'A popup needs a picture or a few words.';
    return problems;
  };

  const save = async (publish?: boolean) => {
    const problems = validate();
    setErrors(problems);
    const firstProblem = Object.keys(problems)[0];
    if (firstProblem) {
      requestAnimationFrame(() => document.getElementById(`mom-${firstProblem}`)?.focus());
      notify.error('Some details need your attention. They are marked in red.');
      return;
    }

    const snapshot: Moment = { ...draft, published: publish ?? draft.published !== false };
    const link = snapshot.link && snapshot.link.label.trim() && toWebUrl(snapshot.link.url) ? { label: snapshot.link.label.trim(), url: toWebUrl(snapshot.link.url) } : undefined;
    const clean: Stored = {
      id: snapshot.id,
      title: snapshot.title.trim(),
      text: snapshot.text.trim(),
      year: snapshot.year.trim(),
      image: snapshot.image,
      imageAlt: (snapshot.imageAlt ?? '').trim(),
      link,
      strip: snapshot.strip,
      popup: snapshot.popup,
      published: snapshot.published !== false,
      // a new stamp each time: an edited popup is shown again, once, to people who closed the old one
      updatedAt: new Date().toISOString(),
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
      notify.error('Your changes could not be saved. Nothing is lost: it is all still on this page. Please try again.');
      return;
    }
    set('published', snapshot.published);
    await markSaved(snapshot);
    notify.success(snapshot.published !== false ? 'Saved. This moment is shown once Moments is switched on.' : 'Saved as a draft. Visitors cannot see it yet.');
  };

  return (
    <div className="space-y-6 pb-4">
      <PageHeader
        icon={Images}
        title={saved.exists ? `Edit: ${initial.title || 'moment'}` : 'New moment'}
        subtitle="Only published moments, and their pictures, can be seen by visitors."
      />

      {Object.keys(errors).length > 0 && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          Please fix: {Object.values(errors).join(' ')}
        </div>
      )}

      <div className="max-w-4xl space-y-6">
        <Panel title="The moment" description="A picture and a few words. Visitors read the words when they hover the picture.">
          <div>
            <label htmlFor="mom-title" className={labelClass}>Title *</label>
            <input id="mom-title" type="text" value={draft.title} maxLength={120} onChange={(e) => set('title', e.target.value)} aria-invalid={Boolean(errors.title)} className={inputClass} placeholder="Winner, State-level hackathon" />
            <FieldError id="err-mom-title" message={errors.title} />
          </div>
          <div>
            <label htmlFor="mom-text" className={labelClass}>A few words</label>
            <textarea id="mom-text" rows={3} value={draft.text} maxLength={400} onChange={(e) => set('text', e.target.value)} className={`${inputClass} resize-y`} />
            <p className={hintClass}>Up to 400 characters. Shown on hover, in the larger view and in the popup.</p>
          </div>
          <div className="max-w-[10rem]">
            <label htmlFor="mom-year" className={labelClass}>Year</label>
            <input id="mom-year" type="text" inputMode="numeric" value={draft.year} maxLength={4} onChange={(e) => set('year', e.target.value)} aria-invalid={Boolean(errors.year)} className={inputClass} placeholder="2026" />
            <FieldError id="err-mom-year" message={errors.year} />
            <p className={hintClass}>Moments are grouped by this year.</p>
          </div>
          <SingleFileEditor file={draft.image} onChange={(file) => set('image', file)} kind="moment" ledger={ledger} label="Picture" help="JPG, PNG, WebP or GIF up to 4 MB. Without a picture, the moment shows a plain card." />
          {draft.image && (
            <div>
              <label htmlFor="mom-alt" className={labelClass}>Describe the picture (for screen readers)</label>
              <input id="mom-alt" type="text" value={draft.imageAlt ?? ''} maxLength={160} onChange={(e) => set('imageAlt', e.target.value)} className={inputClass} />
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="mom-link-label" className={labelClass}>Link button text</label>
              <input id="mom-link-label" type="text" value={draft.link?.label ?? ''} maxLength={30} onChange={(e) => set('link', { label: e.target.value, url: draft.link?.url ?? '' })} className={inputClass} placeholder="Read the story" />
            </div>
            <div>
              <label htmlFor="mom-link" className={labelClass}>Link address</label>
              <input id="mom-link" type="text" value={draft.link?.url ?? ''} onChange={(e) => set('link', { label: draft.link?.label ?? '', url: e.target.value })} aria-invalid={Boolean(errors.link)} className={inputClass} placeholder="https://..." />
              <FieldError id="err-mom-link" message={errors.link} />
            </div>
          </div>
        </Panel>

        <Panel title="Where it shows" description="You can use both, or only one.">
          <Toggle checked={draft.strip} onChange={(value) => set('strip', value)} label="Show on the yearly strip" description="The Moments section on your site, with pictures grouped by year." />
          <Toggle checked={popup.enabled} onChange={(value) => setPopup({ enabled: value })} label="Also show as a popup" description="A window that opens by itself. It is polite: at most one popup per visit, and by default only once on each device." />
          <FieldError id="err-mom-popup" message={errors.popup} />
        </Panel>

        {popup.enabled && (
          <Panel title="Popup settings" description="Visitors can always close it. It never opens on top of another window, and not at all if their browser blocks storage (we could not remember that they saw it).">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="mom-start" className={labelClass}>First day (optional)</label>
                <input id="mom-start" type="date" value={popup.start} onChange={(e) => setPopup({ start: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label htmlFor="mom-end" className={labelClass}>Last day (optional)</label>
                <input id="mom-end" type="date" value={popup.end} onChange={(e) => setPopup({ end: e.target.value })} aria-invalid={Boolean(errors.end)} className={inputClass} />
                <FieldError id="err-mom-end" message={errors.end} />
              </div>
              <div>
                <label htmlFor="mom-delay" className={labelClass}>Appears after (seconds)</label>
                <input id="mom-delay" type="number" min={0} max={60} value={popup.delay} onChange={(e) => setPopup({ delay: Math.min(60, Math.max(0, Number(e.target.value) || 0)) })} className={inputClass} />
              </div>
            </div>
            <p className={hintClass}>Leave both days empty to allow it any day. Days are the visitor&apos;s own calendar days.</p>
            <fieldset>
              <legend className={labelClass}>How often</legend>
              <div className="space-y-2">
                {FREQUENCIES.map((option) => (
                  <label key={option.value} className="flex cursor-pointer items-start gap-3 text-sm">
                    <input type="radio" name="mom-frequency" className="mt-1 accent-purple-600" checked={popup.frequency === option.value} onChange={() => setPopup({ frequency: option.value })} />
                    <span>
                      <span className="block font-medium text-gray-900">{option.label}</span>
                      <span className="block text-gray-500">{option.help}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </Panel>
        )}

        <Panel title="Publishing">
          <Toggle
            checked={published}
            onChange={(value) => set('published', value)}
            label="Show on my site"
            description={published ? 'Visitors can see this moment (once Moments is switched on in Appearance).' : 'A draft: only you can see it, and its picture stays private.'}
          />
        </Panel>
      </div>

      <EditorBar published={published} saving={saving} dirty={dirty} onSave={save} onClose={close} />
    </div>
  );
}
