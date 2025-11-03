/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // Environment variables exposed to the browser
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  },

  // Webpack configuration
  webpack: (config) => {
    // Fix for Prisma in webpack
    config.externals.push({
      '@prisma/client': 'commonjs @prisma/client',
    });
    return config;
  },

  // Output configuration for standalone builds
  output: 'standalone',

  // Experimental features
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
};

module.exports = nextConfig;
