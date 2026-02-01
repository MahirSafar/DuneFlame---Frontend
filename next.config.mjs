import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
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
}

export default withNextIntl(nextConfig);
