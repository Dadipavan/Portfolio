// Client-side helpers for the admin panel.
// The session itself lives in an httpOnly cookie set by /api/auth; the browser cannot read or forge it.

export async function login(password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const result = await response.json().catch(() => ({}));
    if (response.ok && result.success) {
      return { success: true };
    }
    return { success: false, error: result.error || 'Login failed' };
  } catch {
    return { success: false, error: 'Could not reach the server' };
  }
}

export async function checkSession(): Promise<boolean> {
  try {
    const response = await fetch('/api/auth', { cache: 'no-store' });
    const result = await response.json();
    return Boolean(result.authenticated);
  } catch {
    return false;
  }
}

export async function logout(): Promise<void> {
  try {
    await fetch('/api/auth', { method: 'DELETE' });
  } finally {
    // Remove the token left behind by the previous client-side login scheme
    localStorage.removeItem('admin_token');
  }
}
