'use client';

import { useEffect, useMemo, useState } from 'react';
import { buildContent } from '@/lib/normalize';
import { LAYOUTS } from '@/lib/siteSettings';
import { resolveTheme } from '@/lib/theme';
import { mergeSiteSettings } from '@/lib/siteSettings';
import type { LayoutId } from '@/lib/types';
import PortfolioProvider from './PortfolioProvider';
import SiteShell from './SiteShell';

interface PreviewHostProps {
  sections: Record<string, unknown>;
  version: string;
  siteUrl: string;
  layout?: LayoutId;
}

export const PREVIEW_MESSAGE = 'portfolio-draft';

// The whole site rendered in the browser from content held in state. The admin panel sends unsaved edits
// to it (postMessage), so changes appear here as they are made, before anything is saved.
export default function PreviewHost({ sections, version, siteUrl, layout }: PreviewHostProps) {
  const [raw, setRaw] = useState<Record<string, unknown>>(() => {
    if (!layout) return sections;
    const settings = mergeSiteSettings(sections.siteSettings);
    return {
      ...sections,
      siteSettings: { ...settings, appearance: { ...settings.appearance, layout } },
    };
  });

  const content = useMemo(() => buildContent(raw, version), [raw, version]);
  const { appearance } = content.siteSettings;

  // Edits arrive from the admin panel that opened this preview
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const message = event.data as { type?: string; section?: string; data?: unknown };
      if (message?.type !== PREVIEW_MESSAGE || typeof message.section !== 'string') return;
      setRaw((current) => ({ ...current, [message.section as string]: message.data }));
    };
    window.addEventListener('message', onMessage);
    window.parent?.postMessage({ type: 'portfolio-preview-ready' }, window.location.origin);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  // The theme, look and accent follow the draft settings (a visitor's own choice does not apply in the preview).
  // The look is also set on the page itself, so that everything outside the site frame (dialogs) uses it too.
  useEffect(() => {
    const layoutTheme = LAYOUTS.find((l) => l.id === appearance.layout)?.defaultTheme ?? 'light';
    const theme = resolveTheme({
      mode: appearance.theme,
      layoutTheme,
      stored: null,
      allowVisitor: false,
      systemDark: window.matchMedia('(prefers-color-scheme: dark)').matches,
    });
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.dataset.layout = appearance.layout;
    root.dataset.accent = appearance.accent;
  }, [appearance.layout, appearance.theme, appearance.accent]);

  return (
    <PortfolioProvider content={content} siteUrl={siteUrl} preview>
      <SiteShell />
    </PortfolioProvider>
  );
}
