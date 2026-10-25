'use client';

// The optional popup for a moment. It is polite: at most one per visit, never inside the days the admin did not
// choose, and by default once on each device (an edited popup is shown again once). It never opens over another
// window, and not inside the admin preview.
import { useEffect, useState } from 'react';
import { memoryKey, pickPopup, popupVersion, type PopupMemory } from '@/lib/moments';
import type { Moment } from '@/lib/types';
import { usePortfolio } from './PortfolioProvider';
import { MomentWindow } from './Moments';

const SESSION_KEY = 'moment-popup-shown';

function recall(moment: Moment): PopupMemory | null {
  try {
    const raw = localStorage.getItem(memoryKey(moment));
    const value = raw ? (JSON.parse(raw) as PopupMemory) : null;
    return value && typeof value.at === 'number' ? value : null;
  } catch {
    return null;
  }
}

function storageWorks(): boolean {
  try {
    const key = '__moment_test__';
    localStorage.setItem(key, '1');
    localStorage.removeItem(key);
    sessionStorage.setItem(key, '1');
    sessionStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export default function MomentPopup() {
  const { content, settings } = usePortfolio();
  const [moment, setMoment] = useState<Moment | null>(null);
  const enabled = settings.features.moments;
  const moments = content.moments;

  useEffect(() => {
    if (!enabled || moments.length === 0) return;
    if (window.self !== window.top) return; // the admin preview
    // without working storage we cannot remember what a visitor has seen, so nothing is shown
    if (!storageWorks()) return;
    if (sessionStorage.getItem(SESSION_KEY)) return;

    const candidate = pickPopup(moments, new Date(), recall, () => false);
    if (!candidate) return;

    const timer = window.setTimeout(() => {
      // never on top of another window the visitor opened
      if (document.querySelector('[role="dialog"]')) return;
      try {
        sessionStorage.setItem(SESSION_KEY, '1');
        localStorage.setItem(
          memoryKey(candidate),
          JSON.stringify({ at: Date.now(), version: popupVersion(candidate) } satisfies PopupMemory)
        );
      } catch {
        return;
      }
      setMoment(candidate);
    }, candidate.popup.delay * 1000);
    return () => window.clearTimeout(timer);
  }, [enabled, moments]);

  if (!moment) return null;
  return <MomentWindow moment={moment} onClose={() => setMoment(null)} />;
}
