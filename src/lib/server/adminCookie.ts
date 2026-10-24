// Server components: is the current visitor a signed-in admin?
import { cookies } from 'next/headers';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/server/session';

export async function isAdminVisitor(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}
