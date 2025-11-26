import type { NextConfig } from "next";

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

  // Improve build performance
  typescript: {
    // Handled by IDE/CI
    ignoreBuildErrors: false,
  },

  // ESLint handled separately
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
