/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fix workspace root detection warning
  outputFileTracingRoot: __dirname,
  
  // Optimize for production deployment
  output: 'standalone',
  
  // Handle file system for API routes (moved from experimental)
  serverExternalPackages: ['fs'],
  
  // File system configuration for webpack
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('fs', 'path');
    }
    return config;
  },
  
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig