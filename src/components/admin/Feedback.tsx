'use client';

// Small messages that appear for a few seconds ("Saved", "Upload failed") and a confirmation window for
// things that cannot be undone. Both are provided once by the admin layout and used by every admin page.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { CircleAlert, CircleCheck, Info, X } from 'lucide-react';

type ToastKind = 'success' | 'error' | 'info';
interface ToastItem {
  id: number;
  kind: ToastKind;
  text: string;
}

export interface Notifier {
  success: (text: string) => void;
  error: (text: string) => void;
  info: (text: string) => void;
}

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  // red button, for deleting
  danger?: boolean;
}

const NotifyContext = createContext<Notifier | null>(null);
const ConfirmContext = createContext<((options: ConfirmOptions) => Promise<boolean>) | null>(null);

export function useNotify(): Notifier {
  const value = useContext(NotifyContext);
  if (!value) throw new Error('useNotify must be used inside the admin layout');
  return value;
}

export function useConfirm(): (options: ConfirmOptions) => Promise<boolean> {
  const value = useContext(ConfirmContext);
  if (!value) throw new Error('useConfirm must be used inside the admin layout');
  return value;
}

const ICONS = { success: CircleCheck, error: CircleAlert, info: Info };
const STYLES: Record<ToastKind, string> = {
  success: 'border-green-200 bg-green-50 text-green-900',
  error: 'border-red-200 bg-red-50 text-red-900',
  info: 'border-blue-200 bg-blue-50 text-blue-900',
};

export default function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  const [pending, setPending] = useState<{
    options: ConfirmOptions;
    resolve: (answer: boolean) => void;
  } | null>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  const dismiss = useCallback(
    (id: number) => setToasts((list) => list.filter((t) => t.id !== id)),
    []
  );

  const notifier = useMemo<Notifier>(() => {
    const push = (kind: ToastKind) => (text: string) => {
      const id = nextId.current++;
      setToasts((list) => [...list.slice(-3), { id, kind, text }]);
      window.setTimeout(() => dismiss(id), kind === 'error' ? 9000 : 5000);
    };
    return { success: push('success'), error: push('error'), info: push('info') };
  }, [dismiss]);

  const confirm = useCallback((options: ConfirmOptions) => {
    returnFocus.current = document.activeElement as HTMLElement | null;
    return new Promise<boolean>((resolve) => setPending({ options, resolve }));
  }, []);

  const answer = useCallback(
    (value: boolean) => {
      pending?.resolve(value);
      setPending(null);
      window.setTimeout(() => returnFocus.current?.focus?.(), 0);
    },
    [pending]
  );

  // focus the safe button first; Escape cancels; Tab stays inside the window
  useEffect(() => {
    if (!pending) return;
    cancelRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        answer(false);
      } else if (event.key === 'Tab') {
        const buttons = [cancelRef.current, confirmRef.current].filter(Boolean) as HTMLElement[];
        const index = buttons.indexOf(document.activeElement as HTMLElement);
        event.preventDefault();
        buttons[(index + (event.shiftKey ? buttons.length - 1 : 1)) % buttons.length]?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [pending, answer]);

  return (
    <NotifyContext.Provider value={notifier}>
      <ConfirmContext.Provider value={confirm}>
        {children}

        <div
          className="pointer-events-none fixed inset-x-0 bottom-4 z-[90] flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6"
          aria-live="polite"
        >
          {toasts.map((toast) => {
            const Icon = ICONS[toast.kind];
            return (
              <div
                key={toast.id}
                role={toast.kind === 'error' ? 'alert' : 'status'}
                className={`pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg ${STYLES[toast.kind]}`}
              >
                <Icon size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
                <p className="min-w-0 flex-1 break-words">{toast.text}</p>
                <button
                  type="button"
                  onClick={() => dismiss(toast.id)}
                  className="shrink-0 rounded p-0.5 opacity-70 hover:opacity-100"
                  aria-label="Dismiss this message"
                >
                  <X size={16} />
                </button>
              </div>
            );
          })}
        </div>

        {pending && (
          <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/50"
              aria-hidden="true"
              onClick={() => answer(false)}
            />
            <div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="confirm-title"
              aria-describedby="confirm-message"
              className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
            >
              <h2 id="confirm-title" className="text-lg font-semibold text-gray-900">
                {pending.options.title}
              </h2>
              <p id="confirm-message" className="mt-2 text-sm text-gray-600">
                {pending.options.message}
              </p>
              <div className="mt-6 flex flex-wrap justify-end gap-3">
                <button
                  ref={cancelRef}
                  type="button"
                  onClick={() => answer(false)}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  {pending.options.cancelLabel ?? 'Cancel'}
                </button>
                <button
                  ref={confirmRef}
                  type="button"
                  onClick={() => answer(true)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${pending.options.danger ? 'bg-red-600 hover:bg-red-700' : 'bg-purple-600 hover:bg-purple-700'}`}
                >
                  {pending.options.confirmLabel ?? 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        )}
      </ConfirmContext.Provider>
    </NotifyContext.Provider>
  );
}
