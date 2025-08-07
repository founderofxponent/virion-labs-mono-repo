/** @type {import('next').NextConfig} */

// Build-time environment variable logging
console.log('=== BUILD TIME ENVIRONMENT VARIABLES ===')
console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL)
console.log('NEXT_PUBLIC_BUSINESS_LOGIC_API_URL:', process.env.NEXT_PUBLIC_BUSINESS_LOGIC_API_URL)
console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('==========================================')

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