'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';

// The id of the section currently in the middle of the screen
export function useActiveSection(ids: string[]): string {
  const [active, setActive] = useState('');
  const key = ids.join('|');

  useEffect(() => {
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && setActive(entry.target.id)),
      { rootMargin: '-35% 0px -55% 0px' }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return active;
}

// Drives a thin reading-progress bar without re-rendering React on every scroll event
export function useScrollProgress(): RefObject<HTMLDivElement | null> {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = ref.current;
    if (!bar) return;
    let frame = 0;
    const update = () => {
      const root = document.documentElement;
      const max = root.scrollHeight - root.clientHeight;
      bar.style.transform = `scaleX(${max > 0 ? Math.min(root.scrollTop / max, 1) : 0})`;
      frame = 0;
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return ref;
}

// "SP" for "Sai Pavan"
export const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('');
