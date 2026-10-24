'use client';

import { useCallback, useRef } from 'react';
import { deleteMedia } from '@/lib/imageTools';
import { useNotify } from './Feedback';

// Keeps track of the files uploaded or removed while a form is open, so that files nobody uses any more are cleaned
// out of storage once the form is saved or cancelled. (The server also refuses to delete a file that saved content uses.)
export interface FileLedger {
  touch: (path: string) => void;
  afterSave: (inUse: Iterable<string>) => Promise<void>;
  afterCancel: (saved: Iterable<string>) => Promise<void>;
}

export function useFileLedger(): FileLedger {
  const touched = useRef(new Set<string>());
  const notify = useNotify();

  const clean = useCallback(
    async (keep: Set<string>) => {
      const orphans = Array.from(touched.current).filter((path) => !keep.has(path));
      if (orphans.length === 0) return;
      const result = await deleteMedia(orphans);
      if (result.error) {
        notify.info(
          `Your changes are saved, but ${orphans.length} unused file${orphans.length === 1 ? '' : 's'} could not be removed from storage. They do no harm and stay private.`
        );
        return;
      }
      orphans.forEach((path) => touched.current.delete(path));
    },
    [notify]
  );

  return {
    touch: useCallback((path: string) => void touched.current.add(path), []),
    afterSave: useCallback((inUse) => clean(new Set(inUse)), [clean]),
    afterCancel: useCallback((saved) => clean(new Set(saved)), [clean]),
  };
}
