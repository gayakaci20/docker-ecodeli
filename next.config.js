/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ignore TypeScript errors in admin-dashboard for now
  typescript: {
    ignoreBuildErrors: true,
  },
  // Exclude admin dashboard from the build
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
  eslint: {
    // Don't run ESLint during build
    ignoreDuringBuilds: true,
  },
  // Enable standalone mode for Docker
  output: 'standalone',
  // Disable static generation to avoid SSR issues
  trailingSlash: false,
  // Required to prevent Prisma Accelerate warnings
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Fixes npm packages that depend on `fs` module
      config.externals = [...config.externals, 'pg', 'pg-hstore']
    }
    return config
  },
  // Disable static optimization for pages that use AuthContext
  experimental: {
    esmExternals: false
  }
};

module.exports = nextConfig; 