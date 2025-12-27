/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.vercel.app',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors. We'll fix these after deployment.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors. We'll fix these after deployment.
    ignoreBuildErrors: false,
  },
  webpack: (config, { isServer }) => {
    // Make optional email packages external to avoid build errors if not installed
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        '@sendgrid/mail': false,
        'nodemailer': false,
      }
    }
    return config
  },
}

module.exports = nextConfig

