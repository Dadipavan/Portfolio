// Simple authentication utility for admin panel
export const ADMIN_PASSWORD = 'admin123'; // Change this to your preferred password

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

export function login(password: string): boolean {
  if (password !== ADMIN_PASSWORD) return false;
  
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 24); // 24 hours session
  
  const token = btoa(JSON.stringify({
    authenticated: true,
    expiry: expiry.toISOString()
  }));
  
  localStorage.setItem('admin_token', token);
  return true;
}

export function logout(): void {
  localStorage.removeItem('admin_token');
}

export function requireAuth() {
  if (!isAuthenticated()) {
    window.location.href = '/admin/login';
  }
}
