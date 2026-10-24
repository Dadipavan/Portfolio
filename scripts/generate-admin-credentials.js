#!/usr/bin/env node
// Generates the two secrets the admin login needs.
//
// Usage:  node scripts/generate-admin-credentials.js
//         (you will be asked to type the admin password you want to use)
//
// Put both output lines in .env.local AND in your hosting provider's environment variables.
// Never commit them to Git.
const crypto = require('node:crypto');
const readline = require('node:readline');

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return `scrypt:${salt.toString('hex')}:${hash.toString('hex')}`;
}

function printCredentials(password) {
  if (password.length < 12) {
    console.error('Password must be at least 12 characters.');
    process.exit(1);
  }
  console.log('\nAdd these lines to .env.local and to your hosting environment variables:\n');
  console.log(`ADMIN_PASSWORD_HASH=${hashPassword(password)}`);
  console.log(`SESSION_SECRET=${crypto.randomBytes(48).toString('base64url')}\n`);
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question('Choose an admin password (min 12 characters): ', (answer) => {
  rl.close();
  printCredentials(answer.trim());
});
