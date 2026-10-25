'use client';

// The editing parts of the resume builder: every field of the resume can be changed here.
// Changes only affect the resume being built, never the portfolio content.
import { useId } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, Plus, Trash2, X } from 'lucide-react';
import {
  newItem,
  newLine,
  type PickItem,
  type PickLine,
  type ResumeHeader,
  type SkillPick,
} from '@/lib/resume/source';

const field =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30';
const softButton =
  'inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-40';

export function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  rows,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  rows?: number;
  hint?: string;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-medium text-gray-600">
        {label}
      </label>
      {rows ? (
        <textarea id={id} rows={rows} className={`${field} resize-y`} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input id={id} type={type} className={field} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      )}
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

export function IconButton({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-md p-1.5 disabled:opacity-30 ${danger ? 'text-gray-400 hover:bg-red-50 hover:text-red-600' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'}`}
    >
      {children}
    </button>
  );
}

// A card that opens and closes, with the section's own controls in its header
export function Accordion({
  title,
  badge,
  open,
  onToggle,
  actions,
  children,
}: {
  title: string;
  badge?: string;
  open: boolean;
  onToggle: () => void;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center gap-1 pr-2">
        <button
          type="button"
          aria-expanded={open}
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-xl px-4 py-3 text-left hover:bg-gray-50"
        >
          <ChevronDown size={16} className={`shrink-0 text-gray-400 transition-transform ${open ? '' : '-rotate-90'}`} />
          <span className="truncate text-sm font-semibold text-gray-900">{title}</span>
          {badge && <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">{badge}</span>}
        </button>
        {actions}
      </div>
      {open && <div className="space-y-4 border-t border-gray-100 p-4">{children}</div>}
    </section>
  );
}

export function HeaderEditor({ header, onChange }: { header: ResumeHeader; onChange: (h: ResumeHeader) => void }) {
  const set = (patch: Partial<ResumeHeader>) => onChange({ ...header, ...patch });
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Name" value={header.name} onChange={(v) => set({ name: v })} />
        <Field label="Headline (under the name)" value={header.headline} onChange={(v) => set({ headline: v })} placeholder="Data Analyst" />
        <Field label="Email" type="email" value={header.email} onChange={(v) => set({ email: v })} />
        <Field label="Phone" value={header.phone} onChange={(v) => set({ phone: v })} />
        <Field label="Location" value={header.location} onChange={(v) => set({ location: v })} />
        <Field label="LinkedIn" value={header.linkedin} onChange={(v) => set({ linkedin: v })} placeholder="linkedin.com/in/you" />
        <Field label="GitHub" value={header.github} onChange={(v) => set({ github: v })} placeholder="github.com/you" />
      </div>
      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-600">Other links (portfolio, Kaggle, …)</p>
        {header.links.map((l, i) => (
          <div key={i} className="flex items-center gap-2">
            <input aria-label="Link name" className={`${field} max-w-[9rem]`} value={l.label} placeholder="Name" onChange={(e) => set({ links: header.links.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)) })} />
            <input aria-label="Link address" className={field} value={l.url} placeholder="https://" onChange={(e) => set({ links: header.links.map((x, k) => (k === i ? { ...x, url: e.target.value } : x)) })} />
            <IconButton label="Remove link" danger onClick={() => set({ links: header.links.filter((_, k) => k !== i) })}>
              <X size={14} />
            </IconButton>
          </div>
        ))}
        <button type="button" className={softButton} onClick={() => set({ links: [...header.links, { label: '', url: '' }] })}>
          <Plus size={13} /> Add a link
        </button>
      </div>
      <p className="text-xs text-gray-500">Empty fields are left out of the resume. Your profile is not changed.</p>
    </>
  );
}

// A list of bullet lines: tick, reword, move, remove, add
export function LinesEditor({
  lines,
  onChange,
  addLabel = 'Add a bullet',
}: {
  lines: PickLine[];
  onChange: (next: PickLine[]) => void;
  addLabel?: string;
}) {
  const patch = (i: number, change: Partial<PickLine>) => onChange(lines.map((l, k) => (k === i ? { ...l, ...change } : l)));
  const swap = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= lines.length) return;
    const copy = [...lines];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    onChange(copy);
  };
  return (
    <div className="space-y-1.5">
      {lines.map((l, i) => (
        <div key={i} className="flex items-start gap-1.5">
          <input type="checkbox" aria-label="Include this line" className="mt-2.5 h-4 w-4 shrink-0 accent-purple-600" checked={l.on} onChange={(e) => patch(i, { on: e.target.checked })} />
          <textarea
            rows={Math.min(5, Math.max(1, Math.ceil(l.text.length / 62)))}
            aria-label="Line text"
            value={l.text}
            onChange={(e) => patch(i, { text: e.target.value })}
            className={`${field} resize-none ${l.on ? '' : 'bg-gray-50 text-gray-500'}`}
          />
          <div className="flex shrink-0 flex-col items-center">
            {l.score > 0 && <span className="text-[11px] font-medium text-green-700">+{Math.round(l.score * 10) / 10}</span>}
            <div className="flex">
              <IconButton label="Move line up" disabled={i === 0} onClick={() => swap(i, -1)}><ArrowUp size={13} /></IconButton>
              <IconButton label="Move line down" disabled={i === lines.length - 1} onClick={() => swap(i, 1)}><ArrowDown size={13} /></IconButton>
              <IconButton label="Remove line" danger onClick={() => onChange(lines.filter((_, k) => k !== i))}><Trash2 size={13} /></IconButton>
            </div>
          </div>
        </div>
      ))}
      <button type="button" className={softButton} onClick={() => onChange([...lines, newLine()])}>
        <Plus size={13} /> {addLabel}
      </button>
    </div>
  );
}

function SelectAll({ list, onChange }: { list: PickItem[]; onChange: (next: PickItem[]) => void }) {
  if (list.length < 2) return null;
  return (
    <div className="flex gap-2 text-xs">
      <button type="button" className="text-purple-700 hover:underline" onClick={() => onChange(list.map((x) => ({ ...x, on: true })))}>Select all</button>
      <span className="text-gray-300">|</span>
      <button type="button" className="text-purple-700 hover:underline" onClick={() => onChange(list.map((x) => ({ ...x, on: false })))}>Clear</button>
    </div>
  );
}

function useSwap<T>(list: T[], onChange: (next: T[]) => void) {
  return (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= list.length) return;
    const copy = [...list];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    onChange(copy);
  };
}

// Experience, projects and education: every field of every entry can be changed
export function EntriesEditor({
  list,
  onChange,
  labels,
  addLabel,
}: {
  list: PickItem[];
  onChange: (next: PickItem[]) => void;
  labels: { left: string; right: string; sub: string };
  addLabel: string;
}) {
  const patch = (i: number, change: Partial<PickItem>) => onChange(list.map((it, k) => (k === i ? { ...it, ...change } : it)));
  const swap = useSwap(list, onChange);
  return (
    <div className="space-y-3">
      <SelectAll list={list} onChange={onChange} />
      {list.length === 0 && <p className="text-sm text-gray-500">Nothing here yet. Add an entry below.</p>}
      {list.map((it, i) => (
        <div key={it.key} className={`rounded-xl border p-3 ${it.on ? 'border-purple-200 bg-purple-50/30' : 'border-gray-200 bg-gray-50/60'}`}>
          <div className="flex items-center gap-2">
            <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-sm font-medium text-gray-900">
              <input type="checkbox" className="h-4 w-4 shrink-0 accent-purple-600" checked={it.on} onChange={(e) => patch(i, { on: e.target.checked })} />
              <span className="truncate">{it.left || 'New entry'}</span>
              {it.score > 0 && <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700" title="How strongly this matches the job description">match {Math.round(it.score * 10) / 10}</span>}
            </label>
            <IconButton label="Move entry up" disabled={i === 0} onClick={() => swap(i, -1)}><ArrowUp size={14} /></IconButton>
            <IconButton label="Move entry down" disabled={i === list.length - 1} onClick={() => swap(i, 1)}><ArrowDown size={14} /></IconButton>
            {it.key.startsWith('new:') && <IconButton label="Delete entry" danger onClick={() => onChange(list.filter((_, k) => k !== i))}><Trash2 size={14} /></IconButton>}
          </div>
          {it.on && (
            <div className="mt-3 space-y-3">
              <div className="grid gap-2 sm:grid-cols-[1fr_11rem]">
                <Field label={labels.left} value={it.left} onChange={(v) => patch(i, { left: v })} />
                <Field label={labels.right} value={it.right} onChange={(v) => patch(i, { right: v })} />
              </div>
              <Field label={labels.sub} value={it.sub} onChange={(v) => patch(i, { sub: v })} />
              <LinesEditor lines={it.lines} onChange={(lines) => patch(i, { lines })} />
            </div>
          )}
        </div>
      ))}
      <button type="button" className={softButton} onClick={() => onChange([...list, newItem()])}>
        <Plus size={13} /> {addLabel}
      </button>
    </div>
  );
}

// Certifications and achievements: one line each
export function OneLineEditor({
  list,
  onChange,
  addLabel,
  placeholder,
}: {
  list: PickItem[];
  onChange: (next: PickItem[]) => void;
  addLabel: string;
  placeholder: string;
}) {
  const patch = (i: number, change: Partial<PickItem>) => onChange(list.map((it, k) => (k === i ? { ...it, ...change } : it)));
  const swap = useSwap(list, onChange);
  return (
    <div className="space-y-2">
      <SelectAll list={list} onChange={onChange} />
      {list.length === 0 && <p className="text-sm text-gray-500">Nothing here yet. Add one below.</p>}
      {list.map((it, i) => {
        const text = it.lines[0]?.text ?? '';
        return (
          <div key={it.key} className="flex items-start gap-1.5">
            <input type="checkbox" aria-label={`Include ${text || 'this item'}`} className="mt-2.5 h-4 w-4 shrink-0 accent-purple-600" checked={it.on} onChange={(e) => patch(i, { on: e.target.checked })} />
            <textarea
              rows={Math.min(4, Math.max(1, Math.ceil(text.length / 62)))}
              aria-label="Text"
              value={text}
              placeholder={placeholder}
              onChange={(e) => patch(i, { left: e.target.value, lines: [{ ...(it.lines[0] ?? newLine()), text: e.target.value, on: true }] })}
              className={`${field} resize-none ${it.on ? '' : 'bg-gray-50 text-gray-500'}`}
            />
            <div className="flex shrink-0 items-center">
              {it.score > 0 && <span className="mr-1 rounded-full bg-green-100 px-1.5 py-0.5 text-[11px] font-medium text-green-700">match</span>}
              <IconButton label="Move up" disabled={i === 0} onClick={() => swap(i, -1)}><ArrowUp size={13} /></IconButton>
              <IconButton label="Move down" disabled={i === list.length - 1} onClick={() => swap(i, 1)}><ArrowDown size={13} /></IconButton>
              {it.key.startsWith('new:') && <IconButton label="Delete" danger onClick={() => onChange(list.filter((_, k) => k !== i))}><Trash2 size={13} /></IconButton>}
            </div>
          </div>
        );
      })}
      <button type="button" className={softButton} onClick={() => onChange([...list, { ...newItem(), lines: [newLine()] }])}>
        <Plus size={13} /> {addLabel}
      </button>
    </div>
  );
}

export function SkillsEditor({ skills, onChange }: { skills: SkillPick[]; onChange: (next: SkillPick[]) => void }) {
  const patch = (i: number, change: Partial<SkillPick>) => onChange(skills.map((c, k) => (k === i ? { ...c, ...change } : c)));
  const swap = useSwap(skills, onChange);
  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">Green skills appear in the job description. Click a skill to leave it out or put it back; type below a group to add one.</p>
      {skills.map((c, i) => (
        <div key={i} className={`rounded-xl border p-3 ${c.on ? 'border-purple-200 bg-purple-50/30' : 'border-gray-200 bg-gray-50/60'}`}>
          <div className="flex items-center gap-2">
            <input type="checkbox" aria-label={`Include ${c.category || 'this group'}`} className="h-4 w-4 shrink-0 accent-purple-600" checked={c.on} onChange={(e) => patch(i, { on: e.target.checked })} />
            <input aria-label="Group name" className={`${field} font-medium`} value={c.category} placeholder="Group name (for example Languages)" onChange={(e) => patch(i, { category: e.target.value })} />
            <IconButton label="Move group up" disabled={i === 0} onClick={() => swap(i, -1)}><ArrowUp size={14} /></IconButton>
            <IconButton label="Move group down" disabled={i === skills.length - 1} onClick={() => swap(i, 1)}><ArrowDown size={14} /></IconButton>
            <IconButton label="Remove group" danger onClick={() => onChange(skills.filter((_, k) => k !== i))}><Trash2 size={14} /></IconButton>
          </div>
          {c.on && (
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              {c.skills.map((s, k) => (
                <span
                  key={k}
                  className={`inline-flex items-center gap-1 rounded-full border py-0.5 pl-2.5 pr-1 text-xs ${
                    !s.on ? 'border-gray-200 bg-gray-50 text-gray-400' : s.hit ? 'border-green-300 bg-green-50 text-green-800' : 'border-gray-300 bg-white text-gray-700'
                  }`}
                >
                  <button type="button" aria-pressed={s.on} onClick={() => patch(i, { skills: c.skills.map((x, y) => (y === k ? { ...x, on: !x.on } : x)) })} className={s.on ? '' : 'line-through'}>
                    {s.name}
                  </button>
                  <button type="button" aria-label={`Remove ${s.name}`} className="rounded-full p-0.5 text-gray-400 hover:bg-white hover:text-red-600" onClick={() => patch(i, { skills: c.skills.filter((_, y) => y !== k) })}>
                    <X size={11} />
                  </button>
                </span>
              ))}
              <AddSkill onAdd={(name) => patch(i, { skills: [...c.skills, { name, on: true, hit: false }] })} />
            </div>
          )}
        </div>
      ))}
      <button type="button" className={softButton} onClick={() => onChange([...skills, { category: '', on: true, skills: [] }])}>
        <Plus size={13} /> Add a skill group
      </button>
    </div>
  );
}

function AddSkill({ onAdd }: { onAdd: (name: string) => void }) {
  return (
    <input
      aria-label="Add a skill"
      placeholder="+ add skill"
      className="w-28 rounded-full border border-dashed border-gray-300 bg-white px-2.5 py-0.5 text-xs text-gray-700 placeholder:text-gray-400 focus:border-purple-500 focus:outline-none"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ',') {
          e.preventDefault();
          const v = e.currentTarget.value.trim().replace(/,$/, '');
          if (v) {
            onAdd(v);
            e.currentTarget.value = '';
          }
        }
      }}
    />
  );
}
