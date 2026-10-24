'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { parseCountable } from '@/lib/charts';

interface CountUpProps {
  value: string;
  animate: boolean;
  className?: string;
}

// Shows a number that counts up when it scrolls into view. The final value is what the server renders,
// so the page reads correctly without JavaScript or with reduced motion.
export default function CountUp({ value, animate, className }: CountUpProps) {
  const parsed = parseCountable(value);
  const ref = useRef<HTMLSpanElement>(null);
  const [current, setCurrent] = useState<number | null>(null); // null = show the final value

  useLayoutEffect(() => {
    const target = parseCountable(value)?.number;
    const el = ref.current;
    if (target === undefined || !animate || !el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let frame = 0;
    setCurrent(0); // starts from zero before the first paint, so there is no flash of the final number

    const run = () => {
      const start = performance.now();
      const duration = 1100;
      const tick = (now: number) => {
        const progress = Math.min(1, (now - start) / duration);
        setCurrent(target * (1 - Math.pow(1 - progress, 3)));
        if (progress < 1) frame = requestAnimationFrame(tick);
        else setCurrent(null);
      };
      frame = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect();
          run();
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      setCurrent(null);
    };
  }, [value, animate]);

  if (!parsed) return <span className={className}>{value}</span>;

  const shown = current === null ? parsed.number : current;
  return (
    <span ref={ref} className={className} aria-label={value}>
      <span aria-hidden="true">
        {parsed.prefix}
        {shown.toFixed(parsed.decimals)}
        {parsed.suffix}
      </span>
    </span>
  );
}
