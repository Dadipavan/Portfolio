// Server-only admin session helpers.
// Sessions are stateless: an HMAC-signed token stored in an httpOnly cookie.
// Required environment variables:
//   SESSION_SECRET       random string, at least 32 characters
//   ADMIN_PASSWORD_HASH  output of `node scripts/generate-admin-credentials.js`
import { createHmac, scrypt, timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createRateLimiter, getClientKey as clientKey, isSameOrigin } from '@/lib/server/rateLimit';

export const SESSION_COOKIE = 'admin_session';
export const SESSION_TTL_SECONDS = 60 * 60 * 12;

const KEY_LENGTH = 64;

function getSecret(): string | null {
  const secret = process.env.SESSION_SECRET;
  return secret && secret.length >= 32 ? secret : null;
}

export function isAuthConfigured(): boolean {
  return Boolean(getSecret() && process.env.ADMIN_PASSWORD_HASH);
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export function createSessionToken(): string | null {
  const secret = getSecret();
  if (!secret) return null;
  const payload = Buffer.from(
    JSON.stringify({ exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS })
  ).toString('base64url');
  return `${payload}.${sign(payload, secret)}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  const secret = getSecret();
  if (!secret || !token) return false;

  const [payload, signature] = token.split('.');
  if (!payload || !signature) return false;

  const expected = Buffer.from(sign(payload, secret));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return false;

  try {
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return typeof exp === 'number' && exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

// Stored format: scrypt:<salt hex>:<hash hex>
export async function verifyPassword(password: string): Promise<boolean> {
  const stored = process.env.ADMIN_PASSWORD_HASH;
  if (!stored) return false;

  const [scheme, saltHex, hashHex] = stored.split(':');
  if (scheme !== 'scrypt' || !saltHex || !hashHex) return false;

  const expected = Buffer.from(hashHex, 'hex');
  const derived = await new Promise<Buffer>((resolve, reject) => {
    scrypt(password, Buffer.from(saltHex, 'hex'), KEY_LENGTH, (err, key) =>
      err ? reject(err) : resolve(key)
    );
  });
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

export function isAdminRequest(request: NextRequest): boolean {
  return verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
}

// Returns an error response when the caller is not an authenticated admin, otherwise null.
export function requireAdmin(request: NextRequest): NextResponse | null {
  if (!getSecret()) {
    return NextResponse.json(
      { success: false, error: 'Admin authentication is not configured on the server' },
      { status: 500 }
    );
  }

  // Reject cross-site requests (the cookie is also SameSite=Strict).
  if (!isSameOrigin(request)) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  if (!isAdminRequest(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

// Login throttle: 5 failed attempts per client per 15 minutes
const loginLimiter = createRateLimiter(5, 15 * 60 * 1000);

export function getClientKey(request: NextRequest): string {
  return clientKey(request);
}

export const isRateLimited = (key: string) => loginLimiter.isLimited(key);
export const recordFailedAttempt = (key: string) => loginLimiter.record(key);
export const clearAttempts = (key: string) => loginLimiter.clear(key);
