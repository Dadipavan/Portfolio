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
export function scrollAndFlash(id: string, block: ScrollLogicalPosition = 'center'): boolean {
  const el = document.getElementById(id);
  if (!el) return false;
  el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block });
  el.classList.remove('flash-highlight');
  void el.offsetWidth; // restart the animation
  el.classList.add('flash-highlight');
  return true;
}
