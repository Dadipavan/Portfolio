import { NextRequest, NextResponse } from 'next/server';
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  clearAttempts,
  createSessionToken,
  getClientKey,
  isAdminRequest,
  isAuthConfigured,
  isRateLimited,
  recordFailedAttempt,
  verifyPassword,
} from '@/lib/server/session';

const cookieOptions = {
  httpOnly: true,
  sameSite: 'strict' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};

// Session status for the admin UI
export async function GET(request: NextRequest) {
  return NextResponse.json({ authenticated: isAdminRequest(request) });
}

// Login
export async function POST(request: NextRequest) {
  if (!isAuthConfigured()) {
    return NextResponse.json(
      { success: false, error: 'Admin authentication is not configured on the server' },
      { status: 500 }
    );
  }

  const clientKey = getClientKey(request);
  if (isRateLimited(clientKey)) {
    return NextResponse.json(
      { success: false, error: 'Too many failed attempts. Try again in 15 minutes.' },
      { status: 429 }
    );
  }

  let password: unknown;
  try {
    ({ password } = await request.json());
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }

  if (typeof password !== 'string' || password.length === 0 || password.length > 256) {
    return NextResponse.json({ success: false, error: 'Password required' }, { status: 400 });
  }

  if (!(await verifyPassword(password))) {
    recordFailedAttempt(clientKey);
    return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 401 });
  }

  clearAttempts(clientKey);
  const token = createSessionToken();
  if (!token) {
    return NextResponse.json(
      { success: false, error: 'Could not create session' },
      { status: 500 }
    );
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE, token, { ...cookieOptions, maxAge: SESSION_TTL_SECONDS });
  return response;
}

// Logout
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE, '', { ...cookieOptions, maxAge: 0 });
  return response;
}
