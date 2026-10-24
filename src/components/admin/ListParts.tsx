'use client';

import { ArrowDown, ArrowUp, ExternalLink, Eye, EyeOff, Pencil, Trash2 } from 'lucide-react';
import { buttonClass, primaryButtonClass } from './kit';

// Pieces shared by the lists of projects, certificates and achievements, so the three pages look and behave the same.

// "Published" or "Draft"
export function StatusBadge({ published }: { published: boolean }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${published ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-900'}`}
    >
      {published ? 'Published' : 'Draft: not on your site'}
    </span>
  );
}

// The row of buttons at the end of a list entry: move, publish or unpublish, view, edit, delete
export function RowActions({
  name,
  index,
  count,
  published,
  busy,
  viewHref,
  onMove,
  onToggle,
  onEdit,
  onDelete,
}: {
  // what the entry is called, for screen readers ("Edit Sales dashboard")
  name: string;
  index: number;
  count: number;
  published: boolean;
  busy: boolean;
  // where the entry can be seen on the site (only offered for published entries)
  viewHref?: string;
  onMove: (direction: -1 | 1) => void;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => onMove(-1)}
        disabled={index === 0 || busy}
        className={`${buttonClass} !px-2`}
        aria-label={`Move ${name} up`}
      >
        <ArrowUp size={16} aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => onMove(1)}
        disabled={index === count - 1 || busy}
        className={`${buttonClass} !px-2`}
        aria-label={`Move ${name} down`}
      >
        <ArrowDown size={16} aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={onToggle}
        disabled={busy}
        className={buttonClass}
        aria-label={`${published ? 'Unpublish' : 'Publish'} ${name}`}
      >
        {published ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
        {published ? 'Unpublish' : 'Publish'}
      </button>
      {published && viewHref && (
        <a
          href={viewHref}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClass}
          aria-label={`View ${name} on your site (opens in a new tab)`}
        >
          <ExternalLink size={16} aria-hidden="true" />
          View
        </a>
      )}
      <button
        type="button"
        onClick={onEdit}
        disabled={busy}
        className={buttonClass}
        aria-label={`Edit ${name}`}
      >
        <Pencil size={16} aria-hidden="true" />
        Edit
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={busy}
        className={`${buttonClass} text-red-600`}
        aria-label={`Delete ${name}`}
      >
        <Trash2 size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

// The bar at the bottom of an editor. A published entry has one Save button; a draft can be saved as a draft or
// saved and published in one step.
export function EditorBar({
  published,
  saving,
  dirty,
  onSave,
  onClose,
}: {
  published: boolean;
  saving: boolean;
  dirty: boolean;
  // `publish` is left out to keep the choice made in the form
  onSave: (publish?: boolean) => void;
  onClose: () => void;
}) {
  return (
    <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center gap-3 border-t border-gray-200 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      {published ? (
        <button
          type="button"
          onClick={() => onSave()}
          disabled={saving}
          className={primaryButtonClass}
        >
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      ) : (
        <>
          <button
            type="button"
            onClick={() => onSave(true)}
            disabled={saving}
            className={primaryButtonClass}
          >
            {saving ? 'Saving...' : 'Save and publish'}
          </button>
          <button
            type="button"
            onClick={() => onSave(false)}
            disabled={saving}
            className={buttonClass}
          >
            Save as draft
          </button>
        </>
      )}
      <button type="button" onClick={onClose} disabled={saving} className={buttonClass}>
        {dirty ? 'Cancel' : 'Back to the list'}
      </button>
      <span className={`text-sm ${published ? 'text-green-800' : 'text-amber-800'}`}>
        {published ? 'Will be visible on your site' : 'Draft: not visible on your site'}
      </span>
      {dirty && !saving && <span className="text-sm text-amber-800">Unsaved changes</span>}
    </div>
  );
}
