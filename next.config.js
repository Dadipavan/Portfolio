/** @type {import('next').NextConfig} */

// Security headers sent with every response.
// A Content-Security-Policy is intentionally not set: Next.js needs nonces or 'unsafe-inline'
// for its inline scripts, and a half-configured policy would break the site.
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // SAMEORIGIN (not DENY): the admin panel shows the site in a live preview frame
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
];

const nextConfig = {
  // Pin the workspace root so Next does not pick up lockfiles from parent folders
  outputFileTracingRoot: __dirname,
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

module.exports = nextConfig;
