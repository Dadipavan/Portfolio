'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Expand, X } from 'lucide-react';
import { KIND_LABELS, type galleryOf } from '@/lib/caseStudy';

export type GalleryItem = ReturnType<typeof galleryOf>[number];

interface LightboxProps {
  items: GalleryItem[];
  index: number;
  onIndex: (index: number) => void;
  onClose: () => void;
}

// A picture shown as large as the screen allows, with keyboard control: arrows move, Escape closes.
function Lightbox({ items, index, onIndex, onClose }: LightboxProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const previousRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const item = items[index];

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    // runs before the window behind it hears the key, so Escape closes only the picture
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopImmediatePropagation();
        onClose();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        onIndex((index + 1) % items.length);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        onIndex((index - 1 + items.length) % items.length);
      } else if (event.key === 'Tab') {
        const buttons = [previousRef.current, nextRef.current, closeRef.current].filter(
          Boolean
        ) as HTMLElement[];
        const at = buttons.indexOf(document.activeElement as HTMLElement);
        event.preventDefault();
        event.stopImmediatePropagation();
        buttons[(at + (event.shiftKey ? buttons.length - 1 : 1)) % buttons.length]?.focus();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      opener?.focus?.();
    };
    // the handlers only need the current index and count
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, items.length]);

  if (!item) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={item.caption || item.alt}
      className="fixed inset-0 z-[80] flex flex-col bg-black/90 p-3 sm:p-6"
    >
      <div className="flex items-center justify-between gap-3 text-white">
        <p className="min-w-0 truncate text-sm" aria-live="polite">
          {index + 1} / {items.length}
          {item.kind ? ` · ${KIND_LABELS[item.kind]}` : ''}
        </p>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
          aria-label="Close the picture"
        >
          <X size={22} aria-hidden="true" />
        </button>
      </div>
      <div
        className="relative flex min-h-0 flex-1 items-center justify-center py-3"
        onClick={onClose}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.src}
          alt={item.alt}
          className="max-h-full max-w-full rounded-lg object-contain"
          onClick={(event) => event.stopPropagation()}
        />
        {items.length > 1 && (
          <>
            <button
              ref={previousRef}
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onIndex((index - 1 + items.length) % items.length);
              }}
              className="absolute top-1/2 left-0 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
              aria-label="Previous picture"
            >
              <ChevronLeft size={26} aria-hidden="true" />
            </button>
            <button
              ref={nextRef}
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onIndex((index + 1) % items.length);
              }}
              className="absolute top-1/2 right-0 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
              aria-label="Next picture"
            >
              <ChevronRight size={26} aria-hidden="true" />
            </button>
          </>
        )}
      </div>
      {item.caption && (
        <p className="mx-auto max-w-3xl text-center text-sm text-white/90">{item.caption}</p>
      )}
    </div>,
    document.body
  );
}

// The pictures of a project: one large picture (never cropped, so charts and dashboards stay readable),
// small previews to choose from, and a full-screen view.
export default function Gallery({ items, title }: { items: GalleryItem[]; title: string }) {
  const [current, setCurrent] = useState(0);
  const [open, setOpen] = useState(false);
  const active = items[Math.min(current, items.length - 1)];
  if (!active) return null;

  return (
    <figure className="space-y-3">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group border-line bg-surface relative block w-full overflow-hidden rounded-xl border"
        aria-label={`Open picture ${current + 1} of ${items.length} full screen: ${active.caption || active.alt}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={active.src}
          alt={active.alt}
          width={active.width}
          height={active.height}
          className="mx-auto max-h-[26rem] w-full object-contain"
          loading="lazy"
          decoding="async"
        />
        <span className="bg-card/90 text-ink absolute top-3 right-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold opacity-90 group-hover:opacity-100">
          <Expand aria-hidden="true" className="h-3.5 w-3.5" />
          Full screen
        </span>
      </button>

      {(active.caption || active.kind) && (
        <figcaption className="text-muted flex flex-wrap items-center gap-2 text-sm">
          {active.kind && <span className="chip">{KIND_LABELS[active.kind]}</span>}
          {active.caption}
        </figcaption>
      )}

      {items.length > 1 && (
        <ul className="flex gap-2 overflow-x-auto pb-1" aria-label={`${title}: choose a picture`}>
          {items.map((item, index) => (
            <li key={item.id} className="shrink-0">
              <button
                type="button"
                onClick={() => setCurrent(index)}
                aria-label={`Show picture ${index + 1}${item.caption ? `: ${item.caption}` : ''}`}
                aria-current={index === current ? 'true' : undefined}
                className={`block h-16 w-24 overflow-hidden rounded-lg border-2 ${index === current ? 'border-accent' : 'border-line opacity-80 hover:opacity-100'}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.src}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && (
        <Lightbox
          items={items}
          index={current}
          onIndex={setCurrent}
          onClose={() => setOpen(false)}
        />
      )}
    </figure>
  );
}
