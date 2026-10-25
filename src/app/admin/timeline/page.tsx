'use client';

import { useMemo, useState } from 'react';
import {
  Award,
  Briefcase,
  Flag,
  GraduationCap,
  History,
  Layers,
  Plus,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import AdminLoadError from '@/components/AdminLoadError';
import {
  FieldError,
  PageHeader,
  Panel,
  SaveBar,
  Toggle,
  buttonClass,
  hintClass,
  inputClass,
  labelClass,
} from '@/components/admin/kit';
import { buildContent } from '@/lib/normalize';
import { collectTimeline, sortTimeline, type TimelineType } from '@/lib/timeline';
import { toWebUrl } from '@/lib/url';
import type { TimelineEdits } from '@/lib/types';
import { useSettingsEditor } from '@/lib/useSettingsEditor';

const KINDS: Record<TimelineType, { label: string; icon: LucideIcon }> = {
  experience: { label: 'Experience', icon: Briefcase },
  education: { label: 'Education', icon: GraduationCap },
  project: { label: 'Project', icon: Layers },
  certification: { label: 'Certificate', icon: Award },
  milestone: { label: 'Milestone', icon: Flag },
};

const OWNED = ['timelineEdits'] as const;
const yearOk = (value: string) =>
  /^\d{4}$/.test(value) && Number(value) >= 1950 && Number(value) <= 2100;

type Override = { title?: string; subtitle?: string; year?: number };

export default function TimelineAdmin() {
  const { settings, update, portfolio, loading, loadError, saving, status, dirty, save } =
    useSettingsEditor(useMemo(() => [...OWNED], []));
  const [errors, setErrors] = useState<Record<string, string>>({});

  // what the other sections produce, before any edit
  const base = useMemo(
    () =>
      portfolio
        ? sortTimeline(
            collectTimeline(buildContent(portfolio as unknown as Record<string, unknown>, ''))
          )
        : [],
    [portfolio]
  );

  if (loadError) {
    return (
      <AdminLayout>
        <AdminLoadError message={loadError} />
      </AdminLayout>
    );
  }
  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-purple-500"></div>
        </div>
      </AdminLayout>
    );
  }

  const edits = settings.timelineEdits;
  const set = (patch: Partial<TimelineEdits>) => update({ timelineEdits: { ...edits, ...patch } });
  const setOverride = (id: string, patch: Override) =>
    set({ overrides: { ...edits.overrides, [id]: { ...edits.overrides[id], ...patch } } });
  const resetOverride = (id: string) => {
    const next = { ...edits.overrides };
    delete next[id];
    set({ overrides: next });
  };
  const toggle = (id: string, show: boolean) =>
    set({ hidden: show ? edits.hidden.filter((x) => x !== id) : [...edits.hidden, id] });
  const setCustom = (index: number, patch: Partial<TimelineEdits['custom'][number]>) =>
    set({ custom: edits.custom.map((item, i) => (i === index ? { ...item, ...patch } : item)) });

  const validateAndSave = async () => {
    const problems: Record<string, string> = {};
    edits.custom.forEach((item, index) => {
      if (!item.title.trim()) problems[`title-${index}`] = 'Give the milestone a title.';
      if (!yearOk(String(item.year)))
        problems[`year-${index}`] = 'Use a four-digit year, for example 2025.';
      if (item.url.trim() && !toWebUrl(item.url))
        problems[`url-${index}`] = 'This does not look like a web address.';
    });
    setErrors(problems);
    if (Object.keys(problems).length) return;
    await save((current) => ({
      ...current,
      timelineEdits: {
        ...current.timelineEdits,
        custom: current.timelineEdits.custom.map((item) => ({ ...item, url: toWebUrl(item.url) })),
      },
    }));
  };

  const shownCount =
    base.filter((item) => !edits.hidden.includes(item.id)).length + edits.custom.length;

  return (
    <AdminLayout>
      <div className="mx-auto max-w-3xl space-y-6 pb-4">
        <PageHeader
          icon={History}
          title="Timeline: My path, year by year"
          subtitle="Choose what appears, reword or move entries to another year, and add milestones of your own"
        />
        <p className="text-sm text-gray-600" role="status">
          {shownCount} {shownCount === 1 ? 'entry' : 'entries'} on your site.{' '}
          {shownCount < 3 && 'The timeline needs at least 3 entries to be shown.'}
        </p>

        <Panel
          title="From your other sections"
          description="These come from Experience, Education, Projects and Certificates. Hiding one here only removes it from the timeline; it stays in its own section. Changes to the wording or year apply to the timeline only."
        >
          {base.length === 0 && (
            <p className={hintClass}>
              Nothing yet. Entries appear here once they have a period or year, for example “Jan
              2024 – Present”.
            </p>
          )}
          <ul className="divide-y divide-gray-100">
            {base.map((item) => {
              const kind = KINDS[item.type];
              const Icon = kind.icon;
              const shown = !edits.hidden.includes(item.id);
              const change = edits.overrides[item.id];
              return (
                <li key={item.id} className="py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                      <Icon size={18} aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-sm font-medium ${shown ? 'text-gray-900' : 'text-gray-400 line-through'}`}
                      >
                        {change?.title || item.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {kind.label} · {change?.year ?? item.startYear}
                        {change && <span className="ml-2 font-medium text-purple-700">edited</span>}
                      </p>
                    </div>
                    <Toggle
                      checked={shown}
                      onChange={(value) => toggle(item.id, value)}
                      label="Show"
                    />
                  </div>
                  {shown && (
                    <details className="mt-2 ml-12">
                      <summary className="cursor-pointer text-xs font-medium text-purple-700">
                        Change wording or year
                      </summary>
                      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_7rem]">
                        <div>
                          <label htmlFor={`t-${item.id}`} className={labelClass}>
                            Title
                          </label>
                          <input
                            id={`t-${item.id}`}
                            className={inputClass}
                            value={change?.title ?? ''}
                            placeholder={item.title}
                            maxLength={140}
                            onChange={(e) => setOverride(item.id, { title: e.target.value })}
                          />
                        </div>
                        <div>
                          <label htmlFor={`y-${item.id}`} className={labelClass}>
                            Year
                          </label>
                          <input
                            id={`y-${item.id}`}
                            className={inputClass}
                            inputMode="numeric"
                            defaultValue={change?.year ?? ''}
                            placeholder={String(item.startYear)}
                            onChange={(e) => {
                              const value = e.target.value.trim();
                              setOverride(item.id, {
                                year: yearOk(value) ? Number(value) : undefined,
                              });
                            }}
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label htmlFor={`s-${item.id}`} className={labelClass}>
                            Line under the title
                          </label>
                          <input
                            id={`s-${item.id}`}
                            className={inputClass}
                            value={change?.subtitle ?? ''}
                            placeholder={item.subtitle}
                            maxLength={200}
                            onChange={(e) => setOverride(item.id, { subtitle: e.target.value })}
                          />
                        </div>
                      </div>
                      {change && (
                        <button
                          type="button"
                          onClick={() => resetOverride(item.id)}
                          className={`${buttonClass} mt-3`}
                        >
                          <RotateCcw size={14} aria-hidden="true" />
                          Back to the original
                        </button>
                      )}
                    </details>
                  )}
                </li>
              );
            })}
          </ul>
        </Panel>

        <Panel
          title="Your own milestones"
          description="Things that are not an entry anywhere else: an award, a move, a first job, a launch. They appear in the timeline in the year you give."
        >
          {edits.custom.length === 0 && <p className={hintClass}>No milestones yet.</p>}
          <ul className="space-y-4">
            {edits.custom.map((item, index) => (
              <li key={item.id} className="rounded-xl border border-gray-200 p-4">
                <div className="grid gap-3 sm:grid-cols-[7rem_1fr]">
                  <div>
                    <label htmlFor={`cy-${item.id}`} className={labelClass}>
                      Year
                    </label>
                    <input
                      id={`cy-${item.id}`}
                      className={inputClass}
                      inputMode="numeric"
                      value={item.year || ''}
                      aria-invalid={Boolean(errors[`year-${index}`])}
                      onChange={(e) =>
                        setCustom(index, {
                          year: Number(e.target.value.replace(/\D/g, '').slice(0, 4)),
                        })
                      }
                    />
                    <FieldError id={`err-cy-${item.id}`} message={errors[`year-${index}`]} />
                  </div>
                  <div>
                    <label htmlFor={`ct-${item.id}`} className={labelClass}>
                      Title
                    </label>
                    <input
                      id={`ct-${item.id}`}
                      className={inputClass}
                      value={item.title}
                      maxLength={140}
                      aria-invalid={Boolean(errors[`title-${index}`])}
                      onChange={(e) => setCustom(index, { title: e.target.value })}
                    />
                    <FieldError id={`err-ct-${item.id}`} message={errors[`title-${index}`]} />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor={`cs-${item.id}`} className={labelClass}>
                      Line under the title (optional)
                    </label>
                    <input
                      id={`cs-${item.id}`}
                      className={inputClass}
                      value={item.subtitle}
                      maxLength={200}
                      onChange={(e) => setCustom(index, { subtitle: e.target.value })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor={`cu-${item.id}`} className={labelClass}>
                      Link (optional)
                    </label>
                    <input
                      id={`cu-${item.id}`}
                      className={inputClass}
                      value={item.url}
                      placeholder="https://..."
                      aria-invalid={Boolean(errors[`url-${index}`])}
                      onChange={(e) => setCustom(index, { url: e.target.value })}
                    />
                    <FieldError id={`err-cu-${item.id}`} message={errors[`url-${index}`]} />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => set({ custom: edits.custom.filter((_, i) => i !== index) })}
                  className={`${buttonClass} mt-3 text-red-600`}
                  aria-label={`Remove milestone ${item.title || index + 1}`}
                >
                  <Trash2 size={14} aria-hidden="true" />
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className={buttonClass}
            onClick={() =>
              set({
                custom: [
                  ...edits.custom,
                  {
                    id: Date.now().toString(36),
                    year: new Date().getFullYear(),
                    title: '',
                    subtitle: '',
                    url: '',
                  },
                ],
              })
            }
          >
            <Plus size={16} aria-hidden="true" />
            Add a milestone
          </button>
        </Panel>
      </div>
      <SaveBar onSave={validateAndSave} saving={saving} dirty={dirty} status={status} />
    </AdminLayout>
  );
}
