// Simple password authentication utility
// Removed bcrypt dependency for simpler authentication

// Define the admin password directly
const ADMIN_PASSWORD = 'TryPa$$wordDadi@6563or129';

// Verify a password (simple string comparison)
export function verifyPassword(password: string): boolean {
  return password === ADMIN_PASSWORD;
}

// Get the admin password (for direct comparison)
export function getAdminPassword(): string {
  return ADMIN_PASSWORD;
}

// Check if a password is valid
export function isValidPassword(password: string): boolean {
  return password === ADMIN_PASSWORD;
}