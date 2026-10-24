'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

// Keeps an open page current: after something is saved in the admin panel, the page refreshes itself
// (instantly in the same browser, and within about 20 seconds anywhere else).
export default function LiveSync({ version }: { version: string }) {
  const router = useRouter();
  const known = useRef(version);

  useEffect(() => {
    known.current = version;
  }, [version]);

  useEffect(() => {
    let busy = false;

    const check = async () => {
      if (busy) return;
      busy = true;
      try {
        const response = await fetch('/api/portfolio/version', { cache: 'no-store' });
        const result = await response.json();
        if (
          typeof result.version === 'string' &&
          result.version &&
          result.version !== known.current
        ) {
          known.current = result.version;
          router.refresh();
        }
      } catch {
        /* offline: try again next time */
      } finally {
        busy = false;
      }
    };

    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') check();
    }, 20000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') check();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', check);

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('portfolio-updates');
      channel.onmessage = () => {
        check();
      };
    } catch {
      /* not supported */
    }

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', check);
      channel?.close();
    };
  }, [router]);

  return null;
}
