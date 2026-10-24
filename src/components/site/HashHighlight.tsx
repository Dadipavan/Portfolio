'use client';

import { useEffect } from 'react';
import { scrollAndFlash } from '@/lib/dom';

// Opening the page at an address such as /#project-5 (for example from "View on site" in the admin
// panel) scrolls to that item and flashes it.
export default function HashHighlight() {
  useEffect(() => {
    const run = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id) return;
      const el = document.getElementById(id);
      if (!el || !el.hasAttribute('data-flash')) return;
      window.setTimeout(() => scrollAndFlash(id), 120);
    };
    run();
    window.addEventListener('hashchange', run);
    return () => window.removeEventListener('hashchange', run);
  }, []);

  return null;
}
