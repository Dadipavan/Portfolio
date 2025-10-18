// Secure authentication utility for admin panel (client-side)

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  const token = localStorage.getItem('admin_token');
  if (!token) return false;
  
  try {
    const data = JSON.parse(atob(token));
    const expiry = new Date(data.expiry);
    return expiry > new Date();
  } catch {
    return false;
  }
}

export async function login(password: string): Promise<boolean> {
  try {
    const response = await fetch('/api/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
    });

    const result = await response.json();
    
    if (result.success && result.token) {
      localStorage.setItem('admin_token', result.token);
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error('Login error:', error);
    return false;
  }
}

export function logout(): void {
  localStorage.removeItem('admin_token');
}

export function requireAuth() {
  if (!isAuthenticated()) {
    window.location.href = '/admin/login';
  }
}

// Get session info
export function getSessionInfo(): { loginTime?: string; expiry?: string } | null {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('admin_token');
  if (!token) return null;
  
  try {
    const data = JSON.parse(atob(token));
    return {
      loginTime: data.loginTime,
      expiry: data.expiry
    };
  } catch {
    return null;
  }
}
