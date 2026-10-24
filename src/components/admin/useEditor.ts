'use client';

import { useEffect, useMemo, useState } from 'react';
import { useConfirm } from './Feedback';
import { useFileLedger } from './useFileLedger';

// The state every editor of the content lists shares: the entry being edited, whether it has unsaved changes,
// the warning before leaving with unsaved work, and the clean-up of files uploaded but never saved.
export function useEditor<T extends object>({
  initial,
  exists,
  filesOf,
  onClose,
}: {
  initial: T;
  // saved before (editing) or brand new (adding)
  exists: boolean;
  // the storage files an entry uses
  filesOf: (value: T) => string[];
  onClose: () => void;
}) {
  const confirm = useConfirm();
  const ledger = useFileLedger();
  const [draft, setDraft] = useState<T>(initial);
  // what is saved so far: tells whether anything is unsaved, and which files belong to the saved version
  const [saved, setSaved] = useState(() => ({
    json: JSON.stringify(initial),
    files: exists ? filesOf(initial) : [],
    exists,
  }));

  const dirty = useMemo(() => JSON.stringify(draft) !== saved.json, [draft, saved.json]);

  // the browser warns before the page is closed or reloaded with unsaved work
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const set = <K extends keyof T>(key: K, value: T[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  // call once the entry has been saved: `snapshot` is what was saved
  const markSaved = async (snapshot: T) => {
    setSaved({ json: JSON.stringify(snapshot), files: filesOf(snapshot), exists: true });
    await ledger.afterSave(filesOf(snapshot));
  };

  const close = async () => {
    if (dirty) {
      const ok = await confirm({
        title: 'Leave without saving?',
        message: 'The changes you made since the last save will be lost.',
        confirmLabel: 'Leave without saving',
        cancelLabel: 'Keep editing',
        danger: true,
      });
      if (!ok) return;
    }
    // files uploaded since the last save that are not part of the saved version are deleted
    await ledger.afterCancel(saved.files);
    onClose();
  };

  return { draft, setDraft, set, dirty, saved, markSaved, close, ledger };
}
