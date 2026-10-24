'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Laptop, Smartphone, Tablet } from 'lucide-react';
import Modal from '@/components/site/Modal';
import type { LayoutInfo } from '@/lib/siteSettings';
import { buttonClass, primaryButtonClass } from './kit';

// The screen sizes the preview can show. The page is laid out at the real width of the device and then scaled
// down to fit the dialog, so what you see is what a visitor on that device gets.
const DEVICES = [
  { id: 'desktop', label: 'Desktop', width: 1280, height: 800, Icon: Laptop },
  { id: 'tablet', label: 'Tablet', width: 820, height: 1000, Icon: Tablet },
  { id: 'phone', label: 'Phone', width: 390, height: 780, Icon: Smartphone },
] as const;

type DeviceId = (typeof DEVICES)[number]['id'];

interface LookPreviewProps {
  // the look to show; nothing is shown (the dialog is closed) while this is null
  look: LayoutInfo | null;
  // the look is the one in use on the site
  selected: boolean;
  // keep this function the same between renders: the dialog resets its focus whenever it changes
  onClose: () => void;
  onUse: (look: LayoutInfo) => void;
}

function PreviewBody({
  look,
  selected,
  onClose,
  onUse,
}: {
  look: LayoutInfo;
  selected: boolean;
  onClose: () => void;
  onUse: (look: LayoutInfo) => void;
}) {
  // phones start on the phone size: the desktop size would be far too small to read there
  const [device, setDevice] = useState<DeviceId>(() =>
    typeof window !== 'undefined' && window.innerWidth < 640 ? 'phone' : 'desktop'
  );
  const [available, setAvailable] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const area = useRef<HTMLDivElement>(null);

  // how much room the dialog gives the frame, kept up to date when the window changes size
  useEffect(() => {
    const element = area.current;
    if (!element) return;
    const measure = () => setAvailable(element.clientWidth);
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const spec = DEVICES.find((item) => item.id === device) ?? DEVICES[0];
  const scale = available > 0 ? Math.min(1, available / spec.width) : 1;

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        This is your own content in the {look.name} look. Nothing changes on your site until you
        choose the look and select Save.
      </p>

      <div
        role="radiogroup"
        aria-label="Screen size"
        className="inline-flex rounded-lg border border-gray-300 bg-white p-0.5"
      >
        {DEVICES.map(({ id, label, width, Icon }) => (
          <label key={id} className="cursor-pointer">
            <input
              type="radio"
              name="preview-device"
              value={id}
              checked={device === id}
              onChange={() => setDevice(id)}
              className="peer sr-only"
            />
            <span className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 peer-checked:bg-purple-600 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-purple-500 peer-focus-visible:ring-offset-1">
              <Icon size={16} aria-hidden="true" />
              {label}
              <span className="hidden text-xs opacity-80 sm:inline">{width}px</span>
            </span>
          </label>
        ))}
      </div>

      <div ref={area} className="overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
        <div
          className="relative mx-auto"
          style={{ width: spec.width * scale, height: spec.height * scale }}
        >
          {!loaded && (
            <div
              aria-hidden="true"
              className="absolute inset-0 flex items-center justify-center text-sm text-gray-500"
            >
              Loading the preview...
            </div>
          )}
          <iframe
            title={`Preview of the ${look.name} look`}
            src={`/preview/${look.id}`}
            onLoad={() => setLoaded(true)}
            className="absolute top-0 left-0 border-0 bg-white"
            style={{
              width: spec.width,
              height: spec.height,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-gray-100 pt-4">
        <button type="button" onClick={onClose} className={buttonClass}>
          Close preview
        </button>
        <button
          type="button"
          onClick={() => onUse(look)}
          disabled={selected}
          className={primaryButtonClass}
        >
          {selected ? (
            <>
              <Check size={16} aria-hidden="true" />
              In use
            </>
          ) : (
            'Use this look'
          )}
        </button>
      </div>
    </div>
  );
}

// A dialog that shows the site in one of the looks, at desktop, tablet or phone size, with the admin's own content
export default function LookPreview({ look, selected, onClose, onUse }: LookPreviewProps) {
  return (
    <Modal
      open={Boolean(look)}
      onClose={onClose}
      size="xl"
      fullOnMobile
      title={look ? `Preview: ${look.name}` : ''}
      description={look?.description}
    >
      {look && <PreviewBody look={look} selected={selected} onClose={onClose} onUse={onUse} />}
    </Modal>
  );
}
