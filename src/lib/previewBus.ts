'use client';

// A channel between the admin editors and the live preview. Editors publish their current (even
// unsaved) content; the preview pane forwards it to the page in the frame.
import { useEffect } from 'react';

type Listener = (section: string, data: unknown) => void;

const drafts = new Map<string, unknown>();
const listeners = new Set<Listener>();

export function publishDraft(section: string, data: unknown) {
  drafts.set(section, data);
  listeners.forEach((listener) => listener(section, data));
}

export function subscribeDrafts(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function currentDrafts(): [string, unknown][] {
  return Array.from(drafts.entries());
}

// Call from an editor: whenever `data` changes (and once it has loaded), the preview shows it.
export function useDraftSync(section: string, data: unknown, ready = true) {
  useEffect(() => {
    if (ready) publishDraft(section, data);
  }, [section, data, ready]);
}
