'use client';

// Loads one list from the saved content (projects, certificates, achievements) for an admin page, and saves changes
// to it safely: before every save the latest saved list is read again and the change is applied to that, so an
// older copy of the page (or another tab) can never overwrite newer work. Nothing is saved when the list could not be loaded.
import { useCallback, useEffect, useState } from 'react';
import { getPortfolioDataForEditing, updatePortfolioSection, type PortfolioData } from './dataManager';
import type { SiteSettings } from './types';
import { mergeSiteSettings } from './siteSettings';

export type ListSection = 'projects' | 'certifications' | 'achievements' | 'moments';

type Stored = Record<string, unknown>;

// A new id for a certificate or achievement (projects use the next free number instead)
export const newItemId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

// Entries saved by older versions of the admin have no id. They get one from their position, so that moving, hiding
// and deleting can always name the entry; it becomes permanent the next time the list is saved.
const stamp = (section: ListSection, list: Stored[]): Stored[] =>
  list.map((item, index) =>
    item.id === undefined || item.id === null || item.id === ''
      ? { ...item, id: `${section}-${index + 1}` }
      : item
  );

const readList = (data: PortfolioData, section: ListSection): Stored[] =>
  stamp(section, ((data as unknown as Record<string, unknown>)[section] as Stored[] | undefined) ?? []);

export function useStoredList(section: ListSection) {
  const [items, setItems] = useState<Stored[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(() => mergeSiteSettings(undefined));
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    getPortfolioDataForEditing()
      .then((data: PortfolioData) => {
        setItems(readList(data, section));
        setSettings(mergeSiteSettings(data.siteSettings));
      })
      .catch((error: Error) => {
        console.error('Failed to load saved content:', error);
        setLoadError(error.message);
      })
      .finally(() => setLoading(false));
  }, [section]);

  // Applies `change` to the latest saved list and saves the result. Returns the saved list, or null on failure.
  const apply = useCallback(
    async (change: (latest: Stored[]) => Stored[]): Promise<Stored[] | null> => {
      try {
        const data = await getPortfolioDataForEditing();
        const next = change(readList(data, section));
        const ok = await updatePortfolioSection(section, next as never);
        if (!ok) return null;
        setItems(next);
        return next;
      } catch (error) {
        console.error(`Saving ${section} failed:`, error);
        return null;
      }
    },
    [section]
  );

  return { items, setItems, settings, loading, loadError, apply };
}
