'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { THEME_STORAGE_KEY } from '@/lib/theme';
import { usePortfolio } from './PortfolioProvider';

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const { settings } = usePortfolio();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Follow the theme on <html>, which the inline script and the admin preview can change
  useEffect(() => {
    const root = document.documentElement;
    const read = () => setTheme(root.dataset.theme === 'dark' ? 'dark' : 'light');
    read();
    const observer = new MutationObserver(read);
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  if (!settings.appearance.allowVisitorTheme) return null;

  const next = theme === 'dark' ? 'light' : 'dark';
  const toggle = () => {
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* storage can be blocked */
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      className={`btn-ghost h-10 w-10 !px-0 ${className}`}
    >
      {theme === 'dark' ? (
        <Sun aria-hidden="true" className="h-[18px] w-[18px]" />
      ) : (
        <Moon aria-hidden="true" className="h-[18px] w-[18px]" />
      )}
    </button>
  );
}
