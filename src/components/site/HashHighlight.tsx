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
      // the item may sit on another page of its section: look for it once the section has switched pages
      window.setTimeout(() => {
        const el = document.getElementById(id);
        if (el?.hasAttribute('data-flash')) scrollAndFlash(id);
      }, 160);
    };
    run();
    window.addEventListener('hashchange', run);
    return () => window.removeEventListener('hashchange', run);
  }, []);

  return null;
}
