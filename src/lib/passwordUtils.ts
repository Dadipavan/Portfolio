// Password hashing utility
import bcrypt from 'bcryptjs';

// Hash a password
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

// Verify a password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

// Generate a hash for your password (run this once to get the hash)
export async function generatePasswordHash(password: string): Promise<void> {
  const hash = await hashPassword(password);
  console.log('Password hash for environment variable:');
  console.log(`ADMIN_PASSWORD_HASH=${hash}`);
}

// Get the admin password hash from environment
export function getAdminPasswordHash(): string {
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!hash) {
    throw new Error('ADMIN_PASSWORD_HASH environment variable is not set');
  }
  return hash;
}