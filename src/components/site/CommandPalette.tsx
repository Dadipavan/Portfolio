'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CornerDownLeft, Search } from 'lucide-react';
import { DOWNLOADS, downloadText } from '@/lib/exportData';
import { getProfiles } from '@/lib/profiles';
import { THEME_STORAGE_KEY } from '@/lib/theme';
import { useResume } from './useResume';
import { usePortfolio } from './PortfolioProvider';

type Group = 'Sections' | 'Projects' | 'View as' | 'Actions' | 'Links';

interface PaletteItem {
  id: string;
  group: Group;
  label: string;
  hint?: string;
  keywords?: string;
  run: () => void;
  // stay open and show a message (for example after copying the email address)
  notice?: string;
}

const GROUP_ORDER: Group[] = ['Sections', 'Projects', 'View as', 'Actions', 'Links'];

// Ctrl K / Cmd K: jump to any section or project, switch role, open tools, reach me
export default function CommandPalette() {
  const api = usePortfolio();
  const { content, model, settings, dialogs, closeDialog, toggleDialog } = api;
  const resume = useResume();
  const open = dialogs.palette;

  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [notice, setNotice] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const items = useMemo<PaletteItem[]>(() => {
    const { personalInfo } = content;
    const list: PaletteItem[] = [];
    const add = (item: PaletteItem) => list.push(item);

    model.sections.forEach((section) =>
      add({
        id: `section-${section.id}`,
        group: 'Sections',
        label: section.label,
        hint: 'Jump to this section',
        run: () => api.scrollToSection(section.id),
      })
    );

    content.projects.forEach((project) =>
      add({
        id: `project-${project.id}`,
        group: 'Projects',
        label: project.title,
        hint: project.subtitle,
        keywords: project.technologies.join(' '),
        run: () => api.openProject(project.id),
      })
    );

    if (settings.features.roleSwitch && !model.roles.isEmpty) {
      model.roles.switchOptions.forEach((role) =>
        add({
          id: `role-${role}`,
          group: 'View as',
          label: role === 'all' ? 'View everything' : `View as ${model.roles.title(role)}`,
          hint: 'Changes the projects, skills and resume shown',
          keywords: 'role switch filter',
          run: () => api.setRole(role),
        })
      );
    }

    if (settings.features.quickView)
      add({
        id: 'quick',
        group: 'Actions',
        label: 'Open the 30-second summary',
        hint: 'The whole portfolio on one screen',
        keywords: 'recruiter summary',
        run: () => api.openDialog('quick'),
      });
    if (settings.features.shareTools)
      add({
        id: 'share',
        group: 'Actions',
        label: 'Share, QR code and save contact',
        keywords: 'qr vcard link',
        run: () => api.openDialog('share'),
      });
    if (settings.features.dataDownloads) {
      add({
        id: 'json',
        group: 'Actions',
        label: 'View the data as JSON',
        keywords: 'open data raw',
        run: () => api.openDialog('json'),
      });
      DOWNLOADS.forEach((option) =>
        add({
          id: `download-${option.id}`,
          group: 'Actions',
          label: `Download ${option.label}`,
          keywords: 'export csv json data',
          run: () => {
            downloadText(option.filename, option.mime, option.build(content, api.siteUrl));
            api.track('data_download', option.id);
          },
        })
      );
    }
    if (settings.appearance.allowVisitorTheme)
      add({
        id: 'theme',
        group: 'Actions',
        label: 'Switch between light and dark',
        keywords: 'theme dark mode light',
        run: () => {
          const root = document.documentElement;
          const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
          root.dataset.theme = next;
          try {
            localStorage.setItem(THEME_STORAGE_KEY, next);
          } catch {
            /* storage can be blocked */
          }
        },
      });

    add({
      id: 'resume',
      group: 'Links',
      label: resume.label,
      hint: resume.isFile ? resume.name : 'A print-ready CV built from this portfolio',
      keywords: 'resume cv pdf',
      run: () => window.open(resume.href, '_blank', 'noopener,noreferrer'),
    });
    getProfiles(personalInfo).forEach((profile) =>
      add({
        id: profile.id,
        group: 'Links',
        label: `Open ${profile.label}`,
        hint: profile.url,
        run: () => window.open(profile.url, '_blank', 'noopener,noreferrer'),
      })
    );
    add({
      id: 'email',
      group: 'Links',
      label: 'Send an email',
      hint: personalInfo.email,
      run: () => (window.location.href = `mailto:${personalInfo.email}`),
    });
    add({
      id: 'copy-email',
      group: 'Links',
      label: 'Copy email address',
      hint: personalInfo.email,
      notice: 'Email address copied',
      run: () => {
        navigator.clipboard?.writeText(personalInfo.email).catch(() => {});
      },
    });

    return list.sort((a, b) => GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, model, settings, resume.href, resume.label]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) =>
      `${item.label} ${item.hint ?? ''} ${item.keywords ?? ''}`.toLowerCase().includes(q)
    );
  }, [items, query]);

  // Ctrl/Cmd + K toggles the palette from anywhere
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        toggleDialog('palette');
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [toggleDialog]);

  // Reset, focus the box, lock scrolling, and give focus back on close
  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActive(0);
    setNotice('');
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 0);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open]);

  useEffect(() => setActive(0), [query]);

  useEffect(() => {
    if (open)
      document.getElementById(`palette-option-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  if (!open) return null;

  const close = () => closeDialog('palette');

  const run = (item: PaletteItem) => {
    if (item.notice) {
      item.run();
      setNotice(item.notice);
      window.setTimeout(close, 900);
      return;
    }
    close();
    // wait for the scroll lock to be released before acting
    window.setTimeout(item.run, 60);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (results.length) setActive((value) => (value + 1) % results.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (results.length) setActive((value) => (value - 1 + results.length) % results.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (results[active]) run(results[active]);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      close();
    } else if (event.key === 'Tab') {
      event.preventDefault();
      if (document.activeElement === inputRef.current) closeRef.current?.focus();
      else inputRef.current?.focus();
    }
  };

  let lastGroup = '';

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center px-4 pt-[10vh]"
      role="presentation"
    >
      <div
        className="animate-fade-in absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
        aria-hidden="true"
        onClick={close}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search the portfolio"
        onKeyDown={onKeyDown}
        className="border-line bg-card shadow-lift relative w-full max-w-xl overflow-hidden rounded-2xl border"
      >
        <div className="border-line focus-within:bg-surface flex items-center gap-3 border-b px-4">
          <Search aria-hidden="true" className="text-subtle h-4 w-4 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-autocomplete="list"
            aria-activedescendant={results.length ? `palette-option-${active}` : undefined}
            aria-label="Search sections, projects and actions"
            placeholder="Search sections, projects and actions"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="text-ink placeholder:text-subtle h-14 w-full bg-transparent text-base focus:outline-none"
          />
          <button
            ref={closeRef}
            type="button"
            onClick={close}
            className="kbd hover:bg-card shrink-0 cursor-pointer"
            aria-label="Close search"
          >
            Esc
          </button>
        </div>

        <ul
          id="palette-list"
          role="listbox"
          aria-label="Results"
          className="max-h-[50vh] overflow-y-auto p-2"
        >
          {results.map((item, index) => {
            const heading = item.group !== lastGroup ? item.group : null;
            lastGroup = item.group;
            const selected = index === active;
            return (
              <li key={item.id} role="presentation">
                {heading && <p className="mono-label px-3 pt-3 pb-1">{heading}</p>}
                <div
                  id={`palette-option-${index}`}
                  role="option"
                  aria-selected={selected}
                  onClick={() => run(item)}
                  onMouseMove={() => setActive(index)}
                  className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5 ${
                    selected ? 'bg-accent-soft text-accent-soft-ink' : 'text-body'
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{item.label}</span>
                    {item.hint && (
                      <span className="text-muted block truncate text-xs">{item.hint}</span>
                    )}
                  </span>
                  {selected && <CornerDownLeft aria-hidden="true" className="h-4 w-4 shrink-0" />}
                </div>
              </li>
            );
          })}
        </ul>

        {results.length === 0 && (
          <p className="text-muted px-5 py-10 text-center text-sm">
            Nothing matches &quot;{query}&quot;.
          </p>
        )}

        <div className="border-line bg-surface text-muted flex items-center justify-between gap-3 border-t px-4 py-2.5 text-xs">
          <span className="flex items-center gap-3">
            <span>
              <kbd className="kbd">↑</kbd> <kbd className="kbd">↓</kbd> to move
            </span>
            <span>
              <kbd className="kbd">↵</kbd> to open
            </span>
          </span>
          <span role="status" aria-live="polite" className="text-accent-ink font-medium">
            {notice || `${results.length} result${results.length === 1 ? '' : 's'}`}
          </span>
        </div>
      </div>
    </div>
  );
}
