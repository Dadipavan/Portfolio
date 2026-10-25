// Small browser helpers for scrolling to things and drawing attention to them.

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function scrollToId(id: string, block: ScrollLogicalPosition = 'start'): boolean {
  const el = document.getElementById(id);
  if (!el) return false;
  el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block });
  return true;
}

// Scroll to an item and flash a ring around it
// Sections that show their items a page at a time listen for this, switch to the page that holds the item, and the
// jump is tried again once it is on screen.
export const REVEAL_EVENT = 'portfolio:reveal';

export function scrollAndFlash(
  id: string,
  block: ScrollLogicalPosition = 'center',
  retry = true
): boolean {
  const el = document.getElementById(id);
  if (!el) {
    if (retry && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent<string>(REVEAL_EVENT, { detail: id }));
      window.setTimeout(() => scrollAndFlash(id, block, false), 80);
    }
    return false;
  }
  el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block });
  el.classList.remove('flash-highlight');
  void el.offsetWidth; // restart the animation
  el.classList.add('flash-highlight');
  return true;
}
