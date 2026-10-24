'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

let scrollLocks = 0;

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  // Shown under the title
  description?: string;
  // "right" slides in from the edge (a drawer); "center" is a dialog
  placement?: 'center' | 'right';
  size?: 'md' | 'lg' | 'xl';
  // on a phone the window fills the whole screen (long content such as a project)
  fullOnMobile?: boolean;
  children: React.ReactNode;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Accessible dialog: labelled, traps keyboard focus, closes with Escape or a click outside, and puts
// focus back where it was when it closes.
export default function Modal({
  open,
  onClose,
  title,
  description,
  placement = 'center',
  size = 'md',
  fullOnMobile = false,
  children,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    scrollLocks += 1;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const panel = panelRef.current;
    const focusFirst = window.setTimeout(() => {
      const first =
        panel?.querySelector<HTMLElement>('[data-autofocus]') ??
        panel?.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? panel)?.focus();
    }, 30);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null
      );
      if (items.length === 0) {
        event.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      window.clearTimeout(focusFirst);
      document.removeEventListener('keydown', onKeyDown);
      scrollLocks = Math.max(0, scrollLocks - 1);
      if (scrollLocks === 0) document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  const widths = { md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' };
  const drawer = placement === 'right';

  return createPortal(
    <div
      className={`fixed inset-0 z-[70] flex ${drawer ? 'justify-end' : fullOnMobile ? 'items-start justify-center sm:px-4 sm:pt-[5vh]' : 'items-start justify-center px-4 pt-[6vh]'}`}
    >
      <div
        className="animate-fade-in absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={`${
          drawer
            ? 'animate-slide-in h-full w-full max-w-xl overflow-y-auto border-l'
            : `${widths[size]} w-full overflow-y-auto overscroll-contain ${
                fullOnMobile
                  ? 'h-full rounded-none border-0 sm:h-auto sm:max-h-[90vh] sm:rounded-2xl sm:border'
                  : 'max-h-[88vh] rounded-2xl border'
              }`
        } border-line bg-card shadow-lift relative focus:outline-none`}
      >
        <div className="border-line bg-card/95 sticky top-0 z-10 flex items-start justify-between gap-4 border-b px-6 py-4 backdrop-blur">
          <div className="min-w-0">
            <h2 id={titleId} className="text-ink text-lg font-semibold tracking-tight">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="text-muted mt-0.5 text-sm">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost -mr-2 shrink-0"
            aria-label="Close"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>,
    document.body
  );
}
