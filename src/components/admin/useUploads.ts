'use client';

import { useCallback, useState } from 'react';
import { prepareImage, precheck, uploadMedia } from '@/lib/imageTools';
import type { UploadKind } from '@/lib/media';
import type { MediaFile } from '@/lib/types';
import { useNotify } from './Feedback';
import type { FileLedger } from './useFileLedger';

export interface UploadingItem {
  key: string;
  name: string;
  progress: number;
  error?: string;
}

// Uploads files one after another and reports how far each one is. Failed uploads stay in the list with their
// reason until they are dismissed.
export function useUploads(kind: UploadKind, ledger: FileLedger) {
  const [items, setItems] = useState<UploadingItem[]>([]);
  const notify = useNotify();

  const upload = useCallback(
    async (files: File[]): Promise<MediaFile[]> => {
      const done: MediaFile[] = [];
      for (const file of files) {
        const key = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        setItems((list) => [...list, { key, name: file.name, progress: 0 }]);
        try {
          const problem = await precheck(kind, file);
          if (problem) throw new Error(problem);
          const prepared = await prepareImage(file, kind);
          const media = await uploadMedia(kind, prepared, (progress) =>
            setItems((list) =>
              list.map((item) => (item.key === key ? { ...item, progress } : item))
            )
          );
          ledger.touch(media.path);
          done.push(media);
          setItems((list) => list.filter((item) => item.key !== key));
        } catch (error) {
          const message = error instanceof Error ? error.message : 'The upload failed.';
          setItems((list) =>
            list.map((item) => (item.key === key ? { ...item, error: message } : item))
          );
          notify.error(message);
        }
      }
      return done;
    },
    [kind, ledger, notify]
  );

  const dismiss = useCallback(
    (key: string) => setItems((list) => list.filter((item) => item.key !== key)),
    []
  );

  return { uploading: items, upload, dismiss, busy: items.some((item) => !item.error) };
}
