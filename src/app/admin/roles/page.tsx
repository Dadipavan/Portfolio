'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  Compass,
  Plus,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import AdminLoadError from '@/components/AdminLoadError';
import {
  PageHeader,
  Panel,
  SaveBar,
  buttonClass,
  hintClass,
  inputClass,
  labelClass,
} from '@/components/admin/kit';
import {
  DEFAULT_ROLES,
  MAX_ROLES,
  PALETTES,
  ROLE_ICON_OPTIONS,
  RoleSet,
  slugify,
} from '@/lib/roles';
import { normaliseProjects } from '@/lib/normalize';
import type { PaletteId, RoleDef, RoleIconId } from '@/lib/types';
import { useSettingsEditor } from '@/lib/useSettingsEditor';

const OWNED = ['roles'] as const;

// A list of words edited as one comma-separated text. The text is only tidied when the box is left.
function WordsInput({
  id,
  label,
  hint,
  value,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const [text, setText] = useState(value.join(', '));
  const parse = (raw: string) =>
    Array.from(
      new Set(
        raw
          .split(/[,\n]/)
          .map((word) => word.trim().toLowerCase())
          .filter(Boolean)
      )
    );

  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <textarea
        id={id}
        rows={3}
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          onChange(parse(event.target.value));
        }}
        onBlur={() => setText(parse(text).join(', '))}
        className={`${inputClass} resize-y`}
        placeholder="python, sql, airflow"
      />
      <p className={hintClass}>{hint}</p>
    </div>
  );
}

export default function RolesAdmin() {
  const { settings, update, loading, loadError, saving, status, dirty, save, portfolio } =
    useSettingsEditor(useMemo(() => [...OWNED], []));
  const [open, setOpen] = useState<string | null>(null);
  const [resetCount, setResetCount] = useState(0);
  // roles added in this visit and not saved yet: only these may still change their id when renamed
  const [fresh, setFresh] = useState<string[]>([]);

  useEffect(() => {
    if (!dirty) setFresh([]);
  }, [dirty]);

  const projects = useMemo(
    () => (portfolio ? normaliseProjects(portfolio.projects) : []),
    [portfolio]
  );
  const roleSet = useMemo(() => new RoleSet(settings.roles), [settings.roles]);
  const resumes = (portfolio?.resumes ?? []).filter((resume) => resume.isPublic);

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

  const roles = settings.roles;
  const setRoles = (next: RoleDef[]) => update({ roles: next });
  const patchRole = (id: string, patch: Partial<RoleDef>) =>
    setRoles(roles.map((role) => (role.id === id ? { ...role, ...patch } : role)));

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= roles.length) return;
    const next = [...roles];
    [next[index], next[target]] = [next[target], next[index]];
    setRoles(next);
  };

  const addRole = () => {
    let id = 'new-role';
    let n = 2;
    while (roles.some((role) => role.id === id)) id = `new-role-${n++}`;
    const palette = PALETTES[roles.length % PALETTES.length].id;
    const role: RoleDef = {
      id,
      label: 'New role',
      title: 'New role',
      blurb: '',
      stage: '',
      palette,
      icon: 'layers',
      keywords: [],
      skillKeywords: [],
      headline: '',
      summary: '',
      resumeId: '',
    };
    setRoles([...roles, role]);
    setFresh((ids) => [...ids, id]);
    setOpen(id);
  };

  // Renaming never changes a role's id: projects and resumes refer to it
  const renameRole = (role: RoleDef, label: string) =>
    patchRole(role.id, { label, title: role.title === role.label ? label : role.title });

  // A role added in this visit gets its final id from its name when it is saved
  const finaliseIds = (current: typeof settings): typeof settings => {
    const taken = new Set(
      current.roles.filter((role) => !fresh.includes(role.id)).map((role) => role.id)
    );
    const roles = current.roles.map((role) => {
      if (!fresh.includes(role.id)) return role;
      const base = slugify(role.label) || 'role';
      let id = base;
      let n = 2;
      while (taken.has(id) || id === 'all' || id === 'none') id = `${base}-${n++}`;
      taken.add(id);
      return { ...role, id };
    });
    return { ...current, roles };
  };

  const removeRole = (role: RoleDef) => {
    if (
      !window.confirm(
        `Remove "${role.label}"? Projects tagged with it simply stop showing that role. This is saved when you press Save.`
      )
    )
      return;
    setRoles(roles.filter((other) => other.id !== role.id));
  };

  return (
    <AdminLayout>
      <div className="mx-auto max-w-4xl space-y-6 pb-4">
        <PageHeader
          icon={Compass}
          title="Roles"
          subtitle="The career directions your site is organised around"
        />

        <Panel>
          <p className="text-sm text-gray-600">
            Each role becomes a card under your intro, a button in the &quot;View as&quot; switch, a
            filter on Projects and Skills, a colour in the charts and a choice for your resume.
            Rename them, change their order, or add ones such as &quot;Cloud Engineer&quot; or
            &quot;BI Developer&quot;. A project or skill is matched to a role by the{' '}
            <strong>keywords</strong> you give it, or you can tag projects by hand in Admin &gt;
            Projects.
          </p>
        </Panel>

        <ul className="space-y-3">
          {roles.map((role, index) => {
            const isOpen = open === role.id;
            const matched = projects.filter((project) =>
              roleSet.projectRoles(project).includes(role.id)
            ).length;
            const palette = PALETTES.find((p) => p.id === role.palette);
            return (
              <li key={role.id} className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex flex-wrap items-center gap-3 p-3 sm:p-4">
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : role.id)}
                    aria-expanded={isOpen}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    {isOpen ? (
                      <ChevronDown size={18} aria-hidden="true" />
                    ) : (
                      <ChevronRight size={18} aria-hidden="true" />
                    )}
                    <span
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0 rounded-full"
                      style={{ backgroundColor: palette?.swatch }}
                    />
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-gray-900">
                        {role.label}
                      </span>
                      <span className="block truncate text-sm text-gray-500">
                        {role.title} · {matched} project{matched === 1 ? '' : 's'} match
                      </span>
                    </span>
                  </button>
                  <span className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => move(index, -1)}
                      disabled={index === 0}
                      className={`${buttonClass} !px-2`}
                      aria-label={`Move ${role.label} up`}
                    >
                      <ArrowUp size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(index, 1)}
                      disabled={index === roles.length - 1}
                      className={`${buttonClass} !px-2`}
                      aria-label={`Move ${role.label} down`}
                    >
                      <ArrowDown size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeRole(role)}
                      className={`${buttonClass} !px-2 text-red-600`}
                      aria-label={`Remove ${role.label}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </span>
                </div>

                {isOpen && (
                  <div className="space-y-5 border-t border-gray-100 p-4 sm:p-5">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor={`label-${role.id}`} className={labelClass}>
                          Name of the discipline
                        </label>
                        <input
                          id={`label-${role.id}`}
                          type="text"
                          maxLength={40}
                          value={role.label}
                          onChange={(e) => renameRole(role, e.target.value)}
                          className={inputClass}
                        />
                        <p className={hintClass}>
                          Shown on cards, charts and project tags, for example &quot;Data
                          Engineering&quot;.
                        </p>
                      </div>
                      <div>
                        <label htmlFor={`title-${role.id}`} className={labelClass}>
                          Job title
                        </label>
                        <input
                          id={`title-${role.id}`}
                          type="text"
                          maxLength={40}
                          value={role.title}
                          onChange={(e) => patchRole(role.id, { title: e.target.value })}
                          className={inputClass}
                        />
                        <p className={hintClass}>
                          Shown on the &quot;View as&quot; buttons, for example &quot;Data
                          Engineer&quot;.
                        </p>
                      </div>
                      <div>
                        <label htmlFor={`blurb-${role.id}`} className={labelClass}>
                          One-line description
                        </label>
                        <input
                          id={`blurb-${role.id}`}
                          type="text"
                          maxLength={120}
                          value={role.blurb}
                          onChange={(e) => patchRole(role.id, { blurb: e.target.value })}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label htmlFor={`stage-${role.id}`} className={labelClass}>
                          Pipeline stage
                        </label>
                        <input
                          id={`stage-${role.id}`}
                          type="text"
                          maxLength={30}
                          value={role.stage}
                          onChange={(e) => patchRole(role.id, { stage: e.target.value })}
                          className={inputClass}
                          placeholder="Collect & clean"
                        />
                        <p className={hintClass}>
                          Where the role sits in the life of data (shown while the pipeline look is
                          on).
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <fieldset>
                        <legend className={labelClass}>Colour</legend>
                        <div className="flex flex-wrap gap-2">
                          {PALETTES.map((option) => (
                            <button
                              key={option.id}
                              type="button"
                              aria-pressed={role.palette === option.id}
                              aria-label={option.label}
                              title={option.label}
                              onClick={() =>
                                patchRole(role.id, { palette: option.id as PaletteId })
                              }
                              className={`h-8 w-8 rounded-full border-2 ${role.palette === option.id ? 'border-gray-900' : 'border-transparent'}`}
                              style={{ backgroundColor: option.swatch }}
                            />
                          ))}
                        </div>
                      </fieldset>
                      <div>
                        <label htmlFor={`icon-${role.id}`} className={labelClass}>
                          Icon
                        </label>
                        <select
                          id={`icon-${role.id}`}
                          value={role.icon}
                          onChange={(e) =>
                            patchRole(role.id, { icon: e.target.value as RoleIconId })
                          }
                          className={inputClass}
                        >
                          {ROLE_ICON_OPTIONS.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <WordsInput
                      key={`kw-${role.id}-${resetCount}`}
                      id={`keywords-${role.id}`}
                      label="Keywords that place a project or technology in this role"
                      hint="Separate with commas. A project matches when one of its technologies contains a keyword (short ones such as sql or ai must match a whole word)."
                      value={role.keywords}
                      onChange={(keywords) => patchRole(role.id, { keywords })}
                    />
                    <WordsInput
                      key={`skw-${role.id}-${resetCount}`}
                      id={`skill-keywords-${role.id}`}
                      label="Extra keywords for choosing skills"
                      hint="Used only on the Skills section, in addition to the keywords above (for example python or git)."
                      value={role.skillKeywords}
                      onChange={(skillKeywords) => patchRole(role.id, { skillKeywords })}
                    />

                    <div className="space-y-4 border-t border-gray-100 pt-4">
                      <h3 className="text-sm font-semibold text-gray-900">
                        When a visitor chooses &quot;View as {role.title || role.label}&quot;
                      </h3>
                      <div>
                        <label htmlFor={`headline-${role.id}`} className={labelClass}>
                          Headline
                        </label>
                        <input
                          id={`headline-${role.id}`}
                          type="text"
                          maxLength={140}
                          value={role.headline}
                          onChange={(e) => patchRole(role.id, { headline: e.target.value })}
                          className={inputClass}
                          placeholder="Leave empty to keep your normal headline"
                        />
                      </div>
                      <div>
                        <label htmlFor={`summary-${role.id}`} className={labelClass}>
                          Summary
                        </label>
                        <textarea
                          id={`summary-${role.id}`}
                          rows={3}
                          maxLength={400}
                          value={role.summary}
                          onChange={(e) => patchRole(role.id, { summary: e.target.value })}
                          className={`${inputClass} resize-y`}
                          placeholder="Leave empty to keep your normal intro paragraph"
                        />
                      </div>
                      <div>
                        <label htmlFor={`resume-${role.id}`} className={labelClass}>
                          Resume to offer
                        </label>
                        <select
                          id={`resume-${role.id}`}
                          value={role.resumeId}
                          onChange={(e) => patchRole(role.id, { resumeId: e.target.value })}
                          className={inputClass}
                        >
                          <option value="">The usual resume for this role</option>
                          {resumes.map((resume) => (
                            <option key={resume.id} value={resume.id}>
                              {resume.name || resume.fileName}
                            </option>
                          ))}
                        </select>
                        <p className={hintClass}>
                          Only resumes marked Public in Admin &gt; Resumes can be offered.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        {roles.length === 0 && (
          <Panel>
            <p className="text-sm text-gray-600">
              There are no roles. The role switch, role cards, role colours and role filters are
              hidden on the site until you add one.
            </p>
          </Panel>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={addRole}
            disabled={roles.length >= MAX_ROLES}
            className={buttonClass}
          >
            <Plus size={16} aria-hidden="true" />
            Add a role
          </button>
          <button
            type="button"
            className={buttonClass}
            onClick={() => {
              if (
                !window.confirm(
                  'Go back to the four starter roles (Data Engineering, Data Analytics, Data Science, ML Engineering)? This is saved when you press Save.'
                )
              )
                return;
              setRoles(DEFAULT_ROLES.map((role) => ({ ...role })));
              setResetCount((n) => n + 1);
              setOpen(null);
            }}
          >
            <RotateCcw size={16} aria-hidden="true" />
            Back to the starter roles
          </button>
        </div>
        {roles.length >= MAX_ROLES && (
          <p className={hintClass}>You can have up to {MAX_ROLES} roles.</p>
        )}
      </div>
      <SaveBar onSave={() => save(finaliseIds)} saving={saving} dirty={dirty} status={status} />
    </AdminLayout>
  );
}
