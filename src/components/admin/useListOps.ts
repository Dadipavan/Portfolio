'use client';

import { useState } from 'react';
import { deleteMedia } from '@/lib/imageTools';
import type { useStoredList } from '@/lib/useStoredList';
import { useConfirm, useNotify } from './Feedback';

type Stored = Record<string, unknown>;

export const idOf = (item: Stored) => String(item.id ?? '');

// Moving, publishing/unpublishing and deleting entries of a saved list, with the messages and the confirmation the
// three list pages share. Every change is applied to the latest saved list (see useStoredList).
export function useListOps({
  list,
  flag,
  noun,
  titleOf,
  filesOf,
  afterRemove,
}: {
  list: ReturnType<typeof useStoredList>;
  // the field that says whether the entry is on the site
  flag: 'published' | 'visible';
  // "project", "certificate", "achievement"
  noun: string;
  titleOf: (item: Stored) => string;
  // storage files that belong to an entry: they are deleted from storage together with it
  filesOf: (item: Stored) => string[];
  // anything else to clean up once an entry is deleted
  afterRemove?: (item: Stored) => Promise<void>;
}) {
  const notify = useNotify();
  const confirm = useConfirm();
  const [busyId, setBusyId] = useState<string | null>(null);

  const isPublished = (item: Stored) => item[flag] !== false;

  const move = async (index: number, direction: -1 | 1) => {
    const id = idOf(list.items[index]);
    setBusyId(id);
    const saved = await list.apply((latest) => {
      const from = latest.findIndex((entry) => idOf(entry) === id);
      const to = from + direction;
      if (from < 0 || to < 0 || to >= latest.length) return latest;
      const next = [...latest];
      [next[from], next[to]] = [next[to], next[from]];
      return next;
    });
    setBusyId(null);
    if (!saved) notify.error('The new order could not be saved. Please try again.');
  };

  const toggle = async (item: Stored) => {
    const id = idOf(item);
    const publish = !isPublished(item);
    const title = titleOf(item);
    setBusyId(id);
    const saved = await list.apply((latest) =>
      latest.map((entry) => (idOf(entry) === id ? { ...entry, [flag]: publish } : entry))
    );
    setBusyId(null);
    if (!saved) {
      notify.error('The change could not be saved. Please try again.');
      return;
    }
    notify.success(
      publish
        ? `"${title}" is now visible on your site.`
        : `"${title}" is hidden from your site. It is a draft now.`
    );
  };

  const remove = async (item: Stored) => {
    const title = titleOf(item);
    const files = filesOf(item);
    const ok = await confirm({
      title: `Delete this ${noun}?`,
      message: `"${title}"${files.length > 0 ? ' and its uploaded files' : ''} will be deleted for good. This cannot be undone.`,
      confirmLabel: `Delete ${noun}`,
      danger: true,
    });
    if (!ok) return;
    const id = idOf(item);
    setBusyId(id);
    const saved = await list.apply((latest) => latest.filter((entry) => idOf(entry) !== id));
    setBusyId(null);
    if (!saved) {
      notify.error(`The ${noun} could not be deleted. Please try again.`);
      return;
    }
    notify.success(`"${title}" was deleted.`);
    let leftovers = false;
    if (files.length > 0) leftovers = Boolean((await deleteMedia(files)).error);
    if (afterRemove) {
      try {
        await afterRemove(item);
      } catch {
        leftovers = true;
      }
    }
    if (leftovers) {
      notify.info(
        `The ${noun} is deleted, but some of its files could not be removed from storage. They stay private and do no harm.`
      );
    }
  };

  return { busyId, isPublished, move, toggle, remove };
}
