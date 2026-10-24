'use client';

import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Monitor, Smartphone, Tablet, X } from 'lucide-react';
import { currentDrafts, subscribeDrafts } from '@/lib/previewBus';

const DEVICES = {
  phone: { label: 'Phone', width: 390, icon: Smartphone },
  tablet: { label: 'Tablet', width: 820, icon: Tablet },
  desktop: { label: 'Desktop', width: 1280, icon: Monitor },
} as const;

type Device = keyof typeof DEVICES;

// The live preview: the real site in a frame, at phone, tablet or desktop width. Edits made in the
// admin editors show up here as they happen, before anything is saved.
export default function PreviewPane({ onClose }: { onClose: () => void }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const holder = useRef<HTMLDivElement>(null);
  const [device, setDevice] = useState<Device>('desktop');
  const [box, setBox] = useState({ width: 0, height: 0 });

  // A phone-sized admin starts with the phone view
  useEffect(() => {
    if (window.innerWidth < 1024) setDevice('phone');
  }, []);

  useEffect(() => {
    const el = holder.current;
    if (!el) return;
    const measure = () => setBox({ width: el.clientWidth, height: el.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Send edits to the page in the frame, now and as they change
  useEffect(() => {
    const send = (section: string, data: unknown) => {
      frame.current?.contentWindow?.postMessage(
        { type: 'portfolio-draft', section, data },
        window.location.origin
      );
    };
    const onMessage = (event: MessageEvent) => {
      if (
        event.origin === window.location.origin &&
        event.data?.type === 'portfolio-preview-ready'
      ) {
        currentDrafts().forEach(([section, data]) => send(section, data));
      }
    };
    window.addEventListener('message', onMessage);
    const unsubscribe = subscribeDrafts(send);
    return () => {
      window.removeEventListener('message', onMessage);
      unsubscribe();
    };
  }, []);

  const width = DEVICES[device].width;
  const scale = box.width > 0 ? Math.min(1, box.width / width) : 1;

  return (
    <aside
      aria-label="Live preview of the site"
      className="fixed inset-0 z-[60] flex flex-col bg-white lg:static lg:z-auto lg:w-[44%] lg:max-w-[42rem] lg:min-w-[22rem] lg:border-l lg:border-gray-200"
    >
      <div className="flex items-center justify-between gap-2 border-b border-gray-200 px-3 py-2">
        <div role="group" aria-label="Preview size" className="flex gap-1">
          {(Object.keys(DEVICES) as Device[]).map((id) => {
            const { label, icon: Icon } = DEVICES[id];
            return (
              <button
                key={id}
                type="button"
                aria-pressed={device === id}
                onClick={() => setDevice(id)}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium ${
                  device === id
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon size={16} aria-hidden="true" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-1">
          <a
            href="/preview"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
          >
            <ExternalLink size={16} aria-hidden="true" />
            <span className="hidden sm:inline">Open</span>
            <span className="sr-only"> preview in a new tab</span>
          </a>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div ref={holder} className="relative flex-1 overflow-hidden bg-gray-100">
        <div
          className="mx-auto h-full overflow-hidden bg-white shadow-sm"
          style={{ width: width * scale }}
        >
          <iframe
            ref={frame}
            title="Live preview of the portfolio"
            src="/preview"
            style={{
              width,
              height: scale > 0 ? box.height / scale : '100%',
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              border: 0,
            }}
          />
        </div>
      </div>
      <p className="border-t border-gray-200 px-3 py-1.5 text-xs text-gray-500">
        Shows your edits as you make them, before saving. {Math.round(width)}px wide
        {scale < 1 ? `, shown at ${Math.round(scale * 100)}%` : ''}.
      </p>
    </aside>
  );
}
