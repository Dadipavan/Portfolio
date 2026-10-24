// Light/dark theme resolution. The same rules run in the inline script that sets the theme before the
// first paint, so there is no flash of the wrong theme.
import type { ThemeMode } from './types';

export const THEME_STORAGE_KEY = 'portfolio-theme';

export interface ThemeInput {
  mode: ThemeMode;
  layoutTheme: 'light' | 'dark';
  stored?: string | null;
  allowVisitor: boolean;
  systemDark: boolean;
}

export function resolveTheme({
  mode,
  layoutTheme,
  stored,
  allowVisitor,
  systemDark,
}: ThemeInput): 'light' | 'dark' {
  if (allowVisitor && (stored === 'light' || stored === 'dark')) return stored;
  if (mode === 'light' || mode === 'dark') return mode;
  if (mode === 'system') return systemDark ? 'dark' : 'light';
  return layoutTheme;
}

export interface ThemeScriptConfig {
  mode: ThemeMode;
  layoutTheme: 'light' | 'dark';
  allowVisitor: boolean;
  layout: string;
  accent: string;
  animations: boolean;
}

// Inline script for <head>: sets the theme, look, accent and motion before the first paint, so there is
// no flash of the wrong colours. Skipped on admin pages (their own fixed look) and on the printable CV (always light).
export function themeInitScript(config: ThemeScriptConfig): string {
  const json = JSON.stringify(config).replace(/</g, '\\u003c');
  return `(function(){try{var d=document.documentElement;if(location.pathname.indexOf('/admin')===0||location.pathname.indexOf('/resume')===0)return;var c=${json};var s=null;if(c.allowVisitor){try{s=localStorage.getItem('${THEME_STORAGE_KEY}')}catch(e){}}var t;if(c.allowVisitor&&(s==='light'||s==='dark')){t=s}else if(c.mode==='light'||c.mode==='dark'){t=c.mode}else if(c.mode==='system'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}else{t=c.layoutTheme}d.setAttribute('data-theme',t);d.setAttribute('data-layout',c.layout);d.setAttribute('data-accent',c.accent);if(!c.animations){d.setAttribute('data-motion','off')}}catch(e){}})();`;
}
