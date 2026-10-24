'use client';

// Shared logic of the admin pages that edit the site settings: load the saved settings, hold the edits, show
// them in the live preview as they are made, warn before leaving with unsaved changes, and save only what
// the page owns (so pages never overwrite each other).
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getPortfolioDataForEditing,
  saveSiteSettingsPatch,
  type PortfolioData,
} from './dataManager';
import { useDraftSync } from './previewBus';
import { mergeSiteSettings } from './siteSettings';
import type { SiteSettings } from './types';

type Status = { type: 'success' | 'error'; text: string } | null;

const pick = (settings: SiteSettings, keys: (keyof SiteSettings)[]) =>
  Object.fromEntries(keys.map((key) => [key, settings[key]]));

export function useSettingsEditor(keys: (keyof SiteSettings)[]) {
  const [settings, setSettings] = useState<SiteSettings>(() => mergeSiteSettings(undefined));
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [savedJson, setSavedJson] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  const ownedKeys = useMemo(() => keys, [keys]);

  useEffect(() => {
    getPortfolioDataForEditing()
      .then((data) => {
        const merged = mergeSiteSettings(data.siteSettings);
        setPortfolio(data);
        setSettings(merged);
        setSavedJson(JSON.stringify(pick(merged, ownedKeys)));
      })
      .catch((error: Error) => {
        console.error('Failed to load saved content:', error);
        setLoadError(error.message);
      })
      .finally(() => setLoading(false));
  }, [ownedKeys]);

  // the live preview shows the edits before they are saved
  useDraftSync('siteSettings', settings, !loading && !loadError);

  const dirty = !loading && JSON.stringify(pick(settings, ownedKeys)) !== savedJson;

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const update = useCallback((patch: Partial<SiteSettings>) => {
    setStatus(null);
    setSettings((current) => ({ ...current, ...patch }));
  }, []);

  // `finalise` may adjust the settings just before they are written (the Roles page gives new roles their final id)
  const save = useCallback(
    async (finalise?: (settings: SiteSettings) => SiteSettings) => {
      setSaving(true);
      setStatus(null);
      const source = finalise ? finalise(settings) : settings;
      const saved = await saveSiteSettingsPatch(pick(source, ownedKeys) as Partial<SiteSettings>);
      setSaving(false);
      if (saved) {
        setSettings((current) => ({ ...current, ...pick(saved, ownedKeys) }));
        setSavedJson(JSON.stringify(pick(saved, ownedKeys)));
        setStatus({ type: 'success', text: 'Saved. Your site has been updated.' });
      } else {
        setStatus({ type: 'error', text: 'Could not save the changes. Please try again.' });
      }
    },
    [settings, ownedKeys]
  );

  return { settings, update, portfolio, loading, loadError, saving, status, dirty, save };
}
