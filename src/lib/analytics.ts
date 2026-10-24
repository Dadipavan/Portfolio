// Privacy-friendly visit counting. Sends only an event name, a short target and the chosen role:
// no cookies, no IP address and no identifiers. Honours the browser's Do Not Track setting.
export type TrackEvent =
  | 'page_view'
  | 'role_switch'
  | 'project_open'
  | 'resume_download'
  | 'cv_view'
  | 'demo_open'
  | 'explorer_open'
  | 'json_view'
  | 'data_download'
  | 'share_open'
  | 'quick_view'
  | 'contact_click';

export const TRACK_EVENTS: TrackEvent[] = [
  'page_view',
  'role_switch',
  'project_open',
  'resume_download',
  'cv_view',
  'demo_open',
  'explorer_open',
  'json_view',
  'data_download',
  'share_open',
  'quick_view',
  'contact_click',
];

let enabled = false;

export function setTracking(on: boolean) {
  enabled = on;
}

export function track(event: TrackEvent, target = '', role = ''): void {
  if (!enabled || typeof window === 'undefined') return;
  if (navigator.doNotTrack === '1') return;

  const payload = JSON.stringify({
    event,
    target: String(target).slice(0, 80),
    role,
    layout: document.documentElement.dataset.layout ?? '',
  });

  try {
    if (typeof navigator.sendBeacon === 'function') {
      navigator.sendBeacon('/api/track', new Blob([payload], { type: 'application/json' }));
    } else {
      fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    /* counting must never get in the way of the page */
  }
}
