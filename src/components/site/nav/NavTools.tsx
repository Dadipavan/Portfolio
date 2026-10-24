'use client';

import { useEffect, useState, type Ref } from 'react';
import { Menu, QrCode, Search, Sparkles, X } from 'lucide-react';
import ResumeButton from '../ResumeButton';
import RoleSwitch from '../RoleSwitch';
import ThemeToggle from '../ThemeToggle';
import { usePortfolio } from '../PortfolioProvider';

// The pieces every menu of the site shares: the row of tools (search, summary, share, light/dark, resume, menu
// button) and the list of sections for small screens. The menus of the different looks only decide where they sit.

// where the inline links stop fitting: below this width the menu button takes over
export type MenuFrom = 'lg' | 'xl' | 'never';

const HIDE_FROM: Record<MenuFrom | 'always', string> = {
  lg: 'lg:hidden',
  xl: 'xl:hidden',
  never: 'hidden',
  // for a menu that is the only way around (a dock): never hidden
  always: '',
};
const SHOW_FROM: Record<MenuFrom, string> = {
  lg: 'hidden lg:inline-flex',
  xl: 'hidden xl:inline-flex',
  never: 'hidden sm:inline-flex',
};

export const navLinkClass = (active: boolean) =>
  `whitespace-nowrap rounded-md px-2.5 py-2 text-sm font-medium transition-colors ${active ? 'text-accent-ink' : 'text-muted hover:text-ink'}`;

interface NavToolsProps {
  menuOpen?: boolean;
  onToggleMenu?: () => void;
  menuButtonRef?: Ref<HTMLButtonElement>;
  menuFrom?: MenuFrom;
  // the Resume button (it is part of the menu list on small screens)
  resume?: boolean;
  className?: string;
}

export default function NavTools({
  menuOpen = false,
  onToggleMenu,
  menuButtonRef,
  menuFrom = 'xl',
  resume = true,
  className = '',
}: NavToolsProps) {
  const { settings, toggleDialog, openDialog, t } = usePortfolio();
  const [shortcut, setShortcut] = useState('Ctrl K');

  // Show the shortcut that matches the visitor's keyboard
  useEffect(() => {
    if (/Mac|iPhone|iPad/.test(navigator.platform)) setShortcut('⌘K');
    else setShortcut('Ctrl K');
  }, []);

  return (
    <div className={`flex shrink-0 items-center gap-1 sm:gap-1.5 ${className}`}>
      {settings.features.searchPalette && (
        <button
          type="button"
          onClick={() => toggleDialog('palette')}
          aria-label="Search the portfolio"
          aria-haspopup="dialog"
          className="nav-tool border-line bg-card text-muted hover:border-line-strong hover:text-ink inline-flex h-10 items-center gap-2 rounded-lg border px-2.5 text-sm transition-colors sm:px-3"
        >
          <Search aria-hidden="true" className="h-4 w-4" />
          <kbd className="kbd hidden xl:inline-flex" aria-hidden="true">
            {shortcut}
          </kbd>
        </button>
      )}
      {settings.features.quickView && (
        <button
          type="button"
          onClick={() => openDialog('quick')}
          aria-label="Open the 30-second summary"
          aria-haspopup="dialog"
          title={t('hero.summaryButton')}
          className="nav-tool btn-ghost hidden h-10 !px-2.5 sm:inline-flex"
        >
          <Sparkles aria-hidden="true" className="h-[18px] w-[18px]" />
        </button>
      )}
      {settings.features.shareTools && (
        <button
          type="button"
          onClick={() => openDialog('share')}
          aria-label="Share, QR code and save contact"
          aria-haspopup="dialog"
          title={t('footer.share')}
          className="nav-tool btn-ghost hidden h-10 !px-2.5 md:inline-flex"
        >
          <QrCode aria-hidden="true" className="h-[18px] w-[18px]" />
        </button>
      )}
      <ThemeToggle />
      {resume && (
        <ResumeButton
          compact
          variant="primary"
          className={`${SHOW_FROM[menuFrom]} !min-h-10`}
        />
      )}
      {onToggleMenu && (
        <button
          ref={menuButtonRef}
          type="button"
          className={`nav-tool btn-ghost h-10 !px-2.5 ${HIDE_FROM[menuFrom]}`}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={onToggleMenu}
        >
          {menuOpen ? (
            <X aria-hidden="true" className="h-5 w-5" />
          ) : (
            <Menu aria-hidden="true" className="h-5 w-5" />
          )}
        </button>
      )}
    </div>
  );
}

interface MobileNavProps {
  open: boolean;
  from?: MenuFrom | 'always';
  active: string;
  // scrolls to a section and closes the menu
  onGo: (id: string) => (event: React.MouseEvent) => void;
  // closes the menu (before a dialog opens)
  onClose: () => void;
  className?: string;
}

// Every section, the role switch and the main actions, as one list for small screens
export function MobileNav({ open, from = 'xl', active, onGo, onClose, className = '' }: MobileNavProps) {
  const { model, settings, openDialog, t } = usePortfolio();

  return (
    <nav
      id="mobile-nav"
      aria-label="Mobile"
      hidden={!open}
      className={`mobile-nav border-line max-h-[75vh] overflow-y-auto border-t ${HIDE_FROM[from]} ${className}`}
    >
      <ul className="container-page flex flex-col py-2">
        {model.sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              onClick={onGo(section.id)}
              aria-current={active === section.id ? 'true' : undefined}
              className={`flex items-center justify-between py-3 text-base ${navLinkClass(active === section.id)}`}
            >
              {section.label}
              <span className="text-subtle font-mono text-xs tabular-nums">{section.number}</span>
            </a>
          </li>
        ))}
        {settings.features.roleSwitch && !model.roles.isEmpty && (
          <li className="border-line border-t py-4">
            <RoleSwitch />
          </li>
        )}
        <li className="border-line flex flex-wrap gap-2 border-t py-4">
          {settings.features.quickView && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                onClose();
                openDialog('quick');
              }}
            >
              <Sparkles aria-hidden="true" className="h-4 w-4" />
              {t('hero.summaryButton')}
            </button>
          )}
          {settings.features.shareTools && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                onClose();
                openDialog('share');
              }}
            >
              <QrCode aria-hidden="true" className="h-4 w-4" />
              {t('footer.share')}
            </button>
          )}
          <ResumeButton variant="primary" className="w-full sm:w-auto" />
        </li>
      </ul>
    </nav>
  );
}
