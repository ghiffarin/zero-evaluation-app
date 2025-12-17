import type { NextConfig } from "next";

// Backend API URL - defaults to localhost:3002 for local development
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3002';

const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Compress responses
  compress: true,

  // Output standalone for Docker deployment
  output: 'standalone',

  // Optimize package imports - tree-shake large libraries
  experimental: {
    optimizePackageImports: [
      'recharts',
      'lucide-react',
      'date-fns',
    ],
  },

  // API proxy rewrites - forward /api requests to backend
  // This avoids CORS issues and makes the API URL work at runtime
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },

  // Improve build performance
  typescript: {
    // Handled by IDE/CI
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
