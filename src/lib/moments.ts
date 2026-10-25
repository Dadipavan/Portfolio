// Moments: pictures with a few words, shown by year and, if wanted, as a popup. Pure functions, easy to test.
import type { Moment } from './types';

// The year a moment belongs to: the one typed in the admin, otherwise none ("Other")
export const momentYear = (moment: Moment): string => (/^\d{4}$/.test(moment.year) ? moment.year : '');

export interface YearGroup {
  year: string; // '' = no year
  items: Moment[];
}

// Moments on the strip, newest year first; the order inside a year is the order set in the admin.
// Moments without a year come last.
export function groupByYear(moments: Moment[]): YearGroup[] {
  const groups = new Map<string, Moment[]>();
  moments
    .filter((m) => m.strip)
    .forEach((m) => {
      const year = momentYear(m);
      groups.set(year, [...(groups.get(year) ?? []), m]);
    });
  return Array.from(groups.entries())
    .sort(([a], [b]) => (a === '' ? 1 : b === '' ? -1 : Number(b) - Number(a)))
    .map(([year, items]) => ({ year, items }));
}

const pad = (n: number) => String(n).padStart(2, '0');
// today as YYYY-MM-DD in the visitor's own time
export const dayOf = (date: Date): string => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

// Is the popup inside the days the admin chose?
export function popupInWindow(moment: Moment, now: Date): boolean {
  if (!moment.popup.enabled) return false;
  const today = dayOf(now);
  if (moment.popup.start && today < moment.popup.start) return false;
  if (moment.popup.end && today > moment.popup.end) return false;
  return true;
}

// What a device remembers about a popup it showed: when, and which version of it
export interface PopupMemory {
  at: number; // time it was shown (ms)
  version: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export const popupVersion = (moment: Moment): string => moment.updatedAt ?? '';

// Should this popup be shown now? `memory` is what this device stored; `sessionSeen` is true when it was already
// shown during this visit. An edited popup (new version) counts as new, so it is shown again once.
export function shouldShowPopup(
  moment: Moment,
  now: Date,
  memory: PopupMemory | null,
  sessionSeen: boolean
): boolean {
  if (!popupInWindow(moment, now)) return false;
  if (sessionSeen) return false; // never twice in one visit
  const { frequency } = moment.popup;
  if (frequency === 'session') return true;
  const isNew = !memory || memory.version !== popupVersion(moment);
  if (isNew) return true;
  if (frequency === 'daily') return now.getTime() - memory.at >= DAY_MS;
  return false; // once: this device has already seen this version
}

// The one popup to show on this visit (at most one, so a visitor is never stacked with several)
export function pickPopup(
  moments: Moment[],
  now: Date,
  recall: (moment: Moment) => PopupMemory | null,
  sessionSeen: (moment: Moment) => boolean
): Moment | null {
  return moments.find((m) => shouldShowPopup(m, now, recall(m), sessionSeen(m))) ?? null;
}

export const memoryKey = (moment: Moment) => `moment-popup:${moment.id}`;
