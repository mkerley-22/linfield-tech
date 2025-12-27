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
    if (isServer) {
      // For server-side, mark optional packages as external
      config.externals = config.externals || []
      if (typeof config.externals === 'function') {
        const originalExternals = config.externals
        config.externals = [
          originalExternals,
          (context, request, callback) => {
            if (request === '@sendgrid/mail' || request === 'nodemailer') {
              return callback(null, `commonjs ${request}`)
            }
            callback()
          },
        ]
      } else if (Array.isArray(config.externals)) {
        config.externals.push('@sendgrid/mail', 'nodemailer')
      }
    }
    return config
  },
}

module.exports = nextConfig

