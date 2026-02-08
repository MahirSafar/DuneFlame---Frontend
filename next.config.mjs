import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      // Google Cloud Storage
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        pathname: '/duneflame-images/**',
      },
      // Legacy local storage patterns
      {
        protocol: 'https',
        hostname: 'localhost',
        port: '7190',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '7190',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '7190',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '127.0.0.1',
        port: '7190',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'localhost',
        port: '', // Allow any port
        pathname: '/**',
      },
    ],
  },
  output: 'standalone',
  
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://accounts.google.com https://www.gstatic.com https://appleid.cdn-apple.com https://js.stripe.com https://apis.google.com; " +
                   "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://www.gstatic.com; " +
                   "img-src 'self' data: https: blob:; " +
                   "frame-src 'self' https://accounts.google.com https://appleid.apple.com https://js.stripe.com; " +
                   "connect-src 'self' https://duneflame.com https://accounts.google.com https://www.gstatic.com https://dune-flame-backend-180239181668.me-central1.run.app https://api.stripe.com https://localhost:7190;"
          },
          {
            key: 'Referrer-Policy',
            value: 'no-referrer-when-downgrade',
          }
        ],
      },
    ];
  },
}

export default withNextIntl(nextConfig);