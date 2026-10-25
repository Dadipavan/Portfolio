'use client';

// Small building blocks shared by the admin pages for the site (Appearance, Roles, Text and labels, Site settings).
import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Plus, Save, Trash2 } from 'lucide-react';

export const inputClass =
  'w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm transition placeholder:text-gray-400 hover:border-gray-400 focus:border-purple-500 focus:outline-none focus:ring-4 focus:ring-purple-500/15';
export const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5';
export const hintClass = 'mt-1 text-xs text-gray-500';
export const buttonClass =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-purple-500/20 disabled:cursor-not-allowed disabled:opacity-50';
export const primaryButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-purple-500 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-purple-600/25 transition hover:from-purple-600 hover:to-purple-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-purple-500/30 disabled:cursor-not-allowed disabled:opacity-50';

export function PageHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-100 to-indigo-100 ring-1 ring-purple-200/70">
        <Icon className="h-6 w-6 text-purple-600" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight text-gray-900">{title}</h1>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
    </div>
  );
}

export function Panel({
  title,
  description,
  children,
  className = '',
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`space-y-4 rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm sm:p-6 ${className}`}
    >
      {(title || description) && (
        <div>
          {title && <h2 className="text-lg font-semibold text-gray-900">{title}</h2>}
          {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
        </div>
      )}
      {children}
    </section>
  );
}

// An on/off switch with a label (and an optional explanation)
export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  mixed = false,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  // some of a group are on and some off
  mixed?: boolean;
}) {
  return (
    <label
      className={`flex items-start gap-3 ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
    >
      <button
        type="button"
        role="switch"
        aria-checked={mixed ? 'mixed' : checked}
        disabled={disabled}
        onClick={() => onChange(mixed ? true : !checked)}
        className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 ${
          checked ? 'bg-purple-600' : mixed ? 'bg-purple-300' : 'bg-gray-300'
        }`}
      >
        <span
          aria-hidden="true"
          className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-[1.375rem]' : mixed ? 'translate-x-[0.6875rem]' : 'translate-x-0.5'}`}
        />
      </button>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-gray-900">{label}</span>
        {description && <span className="mt-0.5 block text-sm text-gray-500">{description}</span>}
      </span>
    </label>
  );
}

// The save button, a note about unsaved changes and the result of the last save
export function SaveBar({
  onSave,
  saving,
  dirty,
  status,
  label = 'Save changes',
}: {
  onSave: () => void;
  saving: boolean;
  dirty: boolean;
  status: { type: 'success' | 'error'; text: string } | null;
  label?: string;
}) {
  return (
    <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center gap-3 border-t border-gray-200 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <button
        type="button"
        onClick={onSave}
        disabled={saving || !dirty}
        className={primaryButtonClass}
      >
        <Save size={16} aria-hidden="true" />
        {saving ? 'Saving...' : label}
      </button>
      {dirty && !saving && (
        <span className="text-sm text-amber-700">You have changes that are not saved yet.</span>
      )}
      {status && (
        <p
          role={status.type === 'error' ? 'alert' : 'status'}
          className={`text-sm font-medium ${status.type === 'success' ? 'text-green-700' : 'text-red-700'}`}
        >
          {status.text}
        </p>
      )}
    </div>
  );
}

// A list of short texts: one box per entry, with remove and add buttons
export function StringListEditor({
  items,
  onChange,
  label,
  addLabel,
  placeholder,
  maxItems = 20,
  maxLength = 160,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  label: string;
  addLabel: string;
  placeholder?: string;
  maxItems?: number;
  maxLength?: number;
}) {
  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <input
            type="text"
            aria-label={`${label} ${index + 1}`}
            maxLength={maxLength}
            value={item}
            placeholder={placeholder}
            onChange={(event) =>
              onChange(items.map((value, i) => (i === index ? event.target.value : value)))
            }
            className={inputClass}
          />
          <button
            type="button"
            onClick={() => onChange(items.filter((_, i) => i !== index))}
            className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"
            title="Remove"
            aria-label={`Remove ${label} ${index + 1}`}
          >
            <Trash2 size={16} aria-hidden="true" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, ''])}
        disabled={items.length >= maxItems}
        className={buttonClass}
      >
        <Plus size={16} aria-hidden="true" />
        {addLabel}
      </button>
    </div>
  );
}

// A list of words edited as one comma-separated text. The text is only tidied when the box is left, so typing
// a comma and a space never gets in the way.
export function TagsInput({
  id,
  label,
  hint,
  value,
  onChange,
  placeholder,
  lowercase = false,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  lowercase?: boolean;
}) {
  const [text, setText] = useState(value.join(', '));
  const parse = (raw: string) => {
    const words = raw
      .split(/[,\n]/)
      .map((word) => (lowercase ? word.trim().toLowerCase() : word.trim()))
      .filter(Boolean);
    return Array.from(new Map(words.map((word) => [word.toLowerCase(), word])).values());
  };

  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={text}
        placeholder={placeholder}
        onChange={(event) => {
          setText(event.target.value);
          onChange(parse(event.target.value));
        }}
        onBlur={() => setText(parse(text).join(', '))}
        className={inputClass}
      />
      {hint && <p className={hintClass}>{hint}</p>}
    </div>
  );
}

// A message under a field when it is not valid
export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1 text-sm text-red-700">
      {message}
    </p>
  );
}
