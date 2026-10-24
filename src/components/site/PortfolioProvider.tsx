'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import dynamic from 'next/dynamic';
import { buildSiteModel, type SiteModel } from '@/lib/model';
import { DEFAULT_FILTERS, filterProjects, type ProjectFilters } from '@/lib/query';
import { isLinkable, tagKey } from '@/lib/tags';
import { setTracking, track as sendTrack, type TrackEvent } from '@/lib/analytics';
import { scrollAndFlash, scrollToId } from '@/lib/dom';
import type { Translate } from '@/lib/copy';
import type { PortfolioContent, RoleId, SiteSettings } from '@/lib/types';
import LiveSync from './LiveSync';
import HashHighlight from './HashHighlight';
import CommandPalette from './CommandPalette';

// Dialogs load in the background after the page is interactive
const ExplorerDialog = dynamic(() => import('./dialogs/ExplorerDialog'), { ssr: false });
const CaseStudyDialog = dynamic(() => import('./dialogs/CaseStudyDialog'), { ssr: false });
const QuickViewDialog = dynamic(() => import('./dialogs/QuickViewDialog'), { ssr: false });
const JsonViewDialog = dynamic(() => import('./dialogs/JsonViewDialog'), { ssr: false });
const ShareDialog = dynamic(() => import('./dialogs/ShareDialog'), { ssr: false });

export type DialogName = 'quick' | 'json' | 'share' | 'palette';

const ROLE_STORAGE_KEY = 'portfolio-role';

export interface PortfolioApi {
  content: PortfolioContent;
  model: SiteModel;
  settings: SiteSettings;
  // the site's wording (built-in text with the admin's changes applied)
  t: Translate;
  siteUrl: string;
  preview: boolean;

  filters: ProjectFilters;
  role: RoleId;
  setRole: (role: RoleId) => void;
  setFilters: (patch: Partial<ProjectFilters>) => void;
  resetFilters: () => void;
  showProjects: (patch: Partial<ProjectFilters>) => void;
  showSkills: (role: RoleId) => void;
  scrollToSection: (id: string) => void;
  openProject: (id: string | number) => void;

  caseStudyId: string | number | null;
  openCaseStudy: (id: string | number) => void;
  closeCaseStudy: () => void;

  explorerKey: string | null;
  openTag: (label: string) => void;
  closeExplorer: () => void;

  dialogs: Record<DialogName, boolean>;
  openDialog: (name: DialogName) => void;
  closeDialog: (name: DialogName) => void;
  toggleDialog: (name: DialogName) => void;

  track: (event: TrackEvent, target?: string) => void;
}

const PortfolioContext = createContext<PortfolioApi | null>(null);

export function usePortfolio(): PortfolioApi {
  const api = useContext(PortfolioContext);
  if (!api) throw new Error('usePortfolio must be used inside <PortfolioProvider>');
  return api;
}

interface ProviderProps {
  content: PortfolioContent;
  siteUrl: string;
  // The admin live preview: no visit counting and no live refresh
  preview?: boolean;
  children: React.ReactNode;
}

export default function PortfolioProvider({
  content,
  siteUrl,
  preview = false,
  children,
}: ProviderProps) {
  const model = useMemo(() => buildSiteModel(content), [content]);
  const settings = content.siteSettings;
  const { roles, t } = model;

  const [filters, setFiltersState] = useState<ProjectFilters>(DEFAULT_FILTERS);
  const [caseStudyId, setCaseStudyId] = useState<string | number | null>(null);
  const [explorerKey, setExplorerKey] = useState<string | null>(null);
  const [dialogs, setDialogs] = useState<Record<DialogName, boolean>>({
    quick: false,
    json: false,
    share: false,
    palette: false,
  });

  // The page's look follows the settings, including while they are being edited in the live preview
  const { layout, accent, animations } = settings.appearance;
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.layout = layout;
    root.dataset.accent = accent;
    if (animations) delete root.dataset.motion;
    else root.dataset.motion = 'off';
  }, [layout, accent, animations]);

  // Visit counting (never in the preview)
  const trackingOn = settings.features.insights && !preview;
  useEffect(() => {
    setTracking(trackingOn);
    if (trackingOn) sendTrack('page_view');
    return () => setTracking(false);
  }, [trackingOn]);

  // Restore the role chosen earlier in this visit, or one given in the address (?role=data-science)
  useEffect(() => {
    try {
      const fromUrl = new URLSearchParams(window.location.search).get('role');
      const stored = sessionStorage.getItem(ROLE_STORAGE_KEY);
      const role = roles.isRole(fromUrl) ? fromUrl : roles.isRole(stored) ? stored : null;
      if (role && role !== 'all') setFiltersState((f) => ({ ...f, role }));
    } catch {
      /* storage can be blocked */
    }
    // only on the first visit to the page; the roles can change later while it is open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A role the admin has removed while the page is open falls back to "everything"
  const role = roles.isRole(filters.role) ? filters.role : 'all';

  // A project can be opened straight from its address (?project=3), and the address follows the open project
  const addressChecked = useRef(false);
  useEffect(() => {
    if (addressChecked.current) return;
    addressChecked.current = true;
    try {
      const wanted = new URLSearchParams(window.location.search).get('project');
      if (wanted && content.projects.some((p) => String(p.id) === wanted)) setCaseStudyId(wanted);
    } catch {
      /* the address can not be read */
    }
    // only when the page first opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!addressChecked.current || preview) return;
    try {
      const url = new URL(window.location.href);
      if (caseStudyId === null) url.searchParams.delete('project');
      else url.searchParams.set('project', String(caseStudyId));
      history.replaceState(null, '', url.toString());
    } catch {
      /* ignore */
    }
  }, [caseStudyId, preview]);

  const track = useCallback(
    (event: TrackEvent, target = '') => {
      sendTrack(event, target, role === 'all' ? '' : role);
    },
    [role]
  );

  const setFilters = useCallback((patch: Partial<ProjectFilters>) => {
    setFiltersState((f) => ({ ...f, ...patch }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState((f) => ({ ...DEFAULT_FILTERS, role: f.role }));
  }, []);

  const setRole = useCallback((next: RoleId) => {
    setFiltersState((f) => ({ ...f, role: next }));
    try {
      sessionStorage.setItem(ROLE_STORAGE_KEY, next);
    } catch {
      /* storage can be blocked */
    }
    sendTrack('role_switch', next, next === 'all' ? '' : next);
  }, []);

  const scrollToSection = useCallback((id: string) => {
    scrollToId(id);
    try {
      history.replaceState(null, '', `#${id}`);
    } catch {
      /* ignore */
    }
  }, []);

  const showProjects = useCallback((patch: Partial<ProjectFilters>) => {
    setFiltersState((f) => ({ ...f, ...patch }));
    scrollToId('projects');
  }, []);

  const showSkills = useCallback(
    (next: RoleId) => {
      setRole(next);
      scrollToId('skills');
    },
    [setRole]
  );

  const openProject = useCallback(
    (id: string | number) => {
      const project = content.projects.find((p) => String(p.id) === String(id));
      // If the current filters hide the project, clear them so it can be shown
      setFiltersState((f) =>
        project && filterProjects([project], f, roles).length > 0 ? f : { ...DEFAULT_FILTERS }
      );
      window.setTimeout(() => scrollAndFlash(`project-${id}`), 80);
    },
    [content.projects, roles]
  );

  const openCaseStudy = useCallback(
    (id: string | number) => {
      setCaseStudyId(id);
      track('project_open', String(id));
    },
    [track]
  );
  const closeCaseStudy = useCallback(() => setCaseStudyId(null), []);

  const openTag = useCallback(
    (label: string) => {
      if (settings.features.explorer && isLinkable(model.evidence, label)) {
        setExplorerKey(tagKey(label));
        track('explorer_open', label);
        return;
      }
      // without the explorer, a technology still filters the projects
      if (model.techUsage[tagKey(label)])
        showProjects({ tech: model.techUsage[tagKey(label)].name, role: 'all' });
    },
    [settings.features.explorer, model, track, showProjects]
  );
  const closeExplorer = useCallback(() => setExplorerKey(null), []);

  const openDialog = useCallback(
    (name: DialogName) => setDialogs((d) => ({ ...d, [name]: true })),
    []
  );
  const closeDialog = useCallback(
    (name: DialogName) => setDialogs((d) => ({ ...d, [name]: false })),
    []
  );
  const toggleDialog = useCallback(
    (name: DialogName) => setDialogs((d) => ({ ...d, [name]: !d[name] })),
    []
  );

  const api = useMemo<PortfolioApi>(
    () => ({
      content,
      model,
      settings,
      t,
      siteUrl,
      preview,
      filters: role === filters.role ? filters : { ...filters, role },
      role,
      setRole,
      setFilters,
      resetFilters,
      showProjects,
      showSkills,
      scrollToSection,
      openProject,
      caseStudyId,
      openCaseStudy,
      closeCaseStudy,
      explorerKey,
      openTag,
      closeExplorer,
      dialogs,
      openDialog,
      closeDialog,
      toggleDialog,
      track,
    }),
    [
      content,
      model,
      settings,
      t,
      siteUrl,
      preview,
      filters,
      role,
      setRole,
      setFilters,
      resetFilters,
      showProjects,
      showSkills,
      scrollToSection,
      openProject,
      caseStudyId,
      openCaseStudy,
      closeCaseStudy,
      explorerKey,
      openTag,
      closeExplorer,
      dialogs,
      openDialog,
      closeDialog,
      toggleDialog,
      track,
    ]
  );

  return (
    <PortfolioContext.Provider value={api}>
      {children}
      {settings.features.searchPalette && <CommandPalette />}
      {settings.features.explorer && <ExplorerDialog />}
      {settings.features.caseStudies && <CaseStudyDialog />}
      {settings.features.quickView && <QuickViewDialog />}
      {settings.features.dataDownloads && <JsonViewDialog />}
      {settings.features.shareTools && <ShareDialog />}
      {!preview && <LiveSync version={content.version} />}
      <HashHighlight />
    </PortfolioContext.Provider>
  );
}
