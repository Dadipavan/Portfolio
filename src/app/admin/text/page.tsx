'use client';

import { useEffect, useMemo, useState } from 'react';
import { RotateCcw, Search, Type } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import AdminLoadError from '@/components/AdminLoadError';
import {
  PageHeader,
  Panel,
  SaveBar,
  buttonClass,
  hintClass,
  inputClass,
} from '@/components/admin/kit';
import {
  COPY_DEFAULTS,
  MAX_COPY_LENGTH,
  copyGroups,
  type CopyField,
  type CopyKey,
} from '@/lib/copy';
import { useSettingsEditor } from '@/lib/useSettingsEditor';

const OWNED = ['copy'] as const;

export default function TextAdmin() {
  const { settings, update, loading, loadError, saving, status, dirty, save } = useSettingsEditor(
    useMemo(() => [...OWNED], [])
  );
  const [search, setSearch] = useState('');
  // the Help page links here with ?find=<wording> to open the page already searching
  useEffect(() => {
    const find = new URLSearchParams(window.location.search).get('find');
    if (find) setSearch(find);
  }, []);
  const groups = useMemo(() => copyGroups(), []);

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

  const copy = settings.copy;
  const has = (key: string) => Object.prototype.hasOwnProperty.call(copy, key);
  const valueOf = (field: CopyField) => (has(field.key) ? copy[field.key] : field.text);
  const changed = (field: CopyField) => has(field.key) && copy[field.key].trim() !== field.text;
  const changedCount = groups.reduce((sum, group) => sum + group.fields.filter(changed).length, 0);

  const setValue = (field: CopyField, value: string) =>
    update({ copy: { ...copy, [field.key]: value } });
  const reset = (field: CopyField) => {
    const next = { ...copy };
    delete next[field.key];
    update({ copy: next });
  };
  // a cleared field that may not be empty goes back to the built-in wording
  const tidy = (field: CopyField) => {
    if (has(field.key) && copy[field.key].trim() === '' && !field.optional) reset(field);
  };

  const needle = search.trim().toLowerCase();
  const matches = (field: CopyField) =>
    !needle ||
    [field.label, field.key, field.text, valueOf(field), field.group].some((text) =>
      text.toLowerCase().includes(needle)
    );

  const shownGroups = groups
    .map((group) => ({ ...group, fields: group.fields.filter(matches) }))
    .filter((group) => group.fields.length > 0);

  return (
    <AdminLayout>
      <div className="mx-auto max-w-4xl space-y-6 pb-4">
        <PageHeader
          icon={Type}
          title="Text and labels"
          subtitle="Every heading, button label and line of wording on your site"
        />

        <Panel>
          <p className="text-sm text-gray-600">
            Change any wording here and it changes on the site. Each box shows what visitors see
            now. If you clear a box, the original wording comes back. Your own content (projects,
            experience, about text and so on) is edited on its own page.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-0 flex-1 basis-64">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Find a text, for example Projects or Send message"
                aria-label="Find a text"
                className={`${inputClass} pl-9`}
              />
            </div>
            <span className="text-sm text-gray-600" aria-live="polite">
              {changedCount === 0
                ? 'Nothing changed yet'
                : `${changedCount} text${changedCount === 1 ? '' : 's'} changed`}
            </span>
            {changedCount > 0 && (
              <button
                type="button"
                className={buttonClass}
                onClick={() => {
                  if (
                    window.confirm(
                      'Go back to the original wording everywhere? This is saved when you press Save.'
                    )
                  )
                    update({ copy: {} });
                }}
              >
                <RotateCcw size={16} aria-hidden="true" />
                Back to the original wording
              </button>
            )}
          </div>
        </Panel>

        {shownGroups.length === 0 && (
          <p className="text-sm text-gray-600">No text matches &quot;{search}&quot;.</p>
        )}

        {shownGroups.map((group) => {
          const groupChanged = group.fields.filter(changed).length;
          return (
            <details
              key={group.group}
              open={Boolean(needle)}
              className="group rounded-xl border border-gray-200 bg-white shadow-sm"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 sm:px-6">
                <span className="text-base font-semibold text-gray-900">{group.group}</span>
                <span className="flex items-center gap-3 text-sm text-gray-500">
                  {groupChanged > 0 && (
                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                      {groupChanged} changed
                    </span>
                  )}
                  {group.fields.length} text{group.fields.length === 1 ? '' : 's'}
                </span>
              </summary>
              <div className="space-y-5 border-t border-gray-100 p-4 sm:p-6">
                {group.fields.map((field) => {
                  const id = `copy-${field.key}`;
                  const isChanged = changed(field);
                  const common = {
                    id,
                    value: valueOf(field),
                    maxLength: MAX_COPY_LENGTH,
                    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                      setValue(field, event.target.value),
                    onBlur: () => tidy(field),
                    className: `${inputClass} ${isChanged ? 'border-purple-400' : ''}`,
                  };
                  return (
                    <div key={field.key}>
                      <div className="mb-1.5 flex items-center justify-between gap-3">
                        <label htmlFor={id} className="text-sm font-medium text-gray-700">
                          {field.label}
                        </label>
                        {isChanged && (
                          <button
                            type="button"
                            onClick={() => reset(field)}
                            className="text-xs font-medium text-purple-700 hover:underline"
                          >
                            Use the original
                          </button>
                        )}
                      </div>
                      {field.long ? (
                        <textarea {...common} rows={3} className={`${common.className} resize-y`} />
                      ) : (
                        <input type="text" {...common} />
                      )}
                      {(field.vars || field.optional) && (
                        <p className={hintClass}>
                          {field.vars && (
                            <>
                              You can use {field.vars.map((name) => `{${name}}`).join(', ')} in this
                              text.{' '}
                            </>
                          )}
                          {field.optional && 'You can leave this empty to show nothing.'}
                        </p>
                      )}
                      {isChanged && (
                        <p className={hintClass}>
                          Original: {COPY_DEFAULTS[field.key as CopyKey] || '(empty)'}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </details>
          );
        })}
      </div>
      <SaveBar onSave={() => save()} saving={saving} dirty={dirty} status={status} />
    </AdminLayout>
  );
}
