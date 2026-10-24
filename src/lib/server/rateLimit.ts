// Minimal in-memory rate limiter. Best effort only: serverless instances do not share memory,
// so this slows down abuse but is not a hard guarantee.
export function createRateLimiter(maxHits: number, windowMs: number) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return {
    isLimited(key: string): boolean {
      const entry = hits.get(key);
      return Boolean(entry && entry.resetAt >= Date.now() && entry.count >= maxHits);
    },
    record(key: string): void {
      const now = Date.now();
      const entry = hits.get(key);
      if (!entry || entry.resetAt < now) {
        hits.set(key, { count: 1, resetAt: now + windowMs });
      } else {
        entry.count += 1;
      }
    },
    clear(key: string): void {
      hits.delete(key);
    },
  };
}

export function getClientKey(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
}

// Rejects requests whose Origin header points at a different host (cross-site form posts).
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;

  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
