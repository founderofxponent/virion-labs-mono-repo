/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Reduce timeout to fail faster on prerender issues
  staticPageGenerationTimeout: 60,
  async rewrites() {
    return [
      {
        source: '/api/business-logic/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'https://api.virionlabs.io'}/api/:path*`, // Proxy to Backend
      },
    ]
  },
}

export default nextConfig