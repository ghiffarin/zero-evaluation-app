import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Compress responses
  compress: true,

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
