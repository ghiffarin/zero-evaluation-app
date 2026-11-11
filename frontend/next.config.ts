import type { NextConfig } from "next";

// Backend API URL - defaults to localhost:3001 (the backend's default PORT)
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

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

  // Pages merged or removed in the redesign keep working as bookmarks
  async redirects() {
    return [
      { source: '/daily-log', destination: '/today', permanent: false },
      { source: '/wellness', destination: '/today', permanent: false },
      { source: '/reflections', destination: '/today', permanent: false },
      { source: '/books', destination: '/learn', permanent: false },
      { source: '/journals', destination: '/learn', permanent: false },
      { source: '/skills', destination: '/learn', permanent: false },
      { source: '/career', destination: '/dashboard', permanent: false },
    ];
  },

  // Improve build performance
  typescript: {
    // Handled by IDE/CI
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
