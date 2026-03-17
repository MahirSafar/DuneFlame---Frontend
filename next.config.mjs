import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      // Google Cloud Storage
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        port: '',
        pathname: '/**',
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
        source: '/:all*(svg|jpg|png|webp|avif|ico)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          }
        ],
      },
      {
        source: '/:path*',
        headers: [
          // HSTS Xətası üçün (Bütün əlaqələri məcburi HTTPS edir)
          { 
            key: 'Strict-Transport-Security', 
            value: 'max-age=63072000; includeSubDomains; preload' 
          },
          // Clickjacking (XFO) Xətası üçün (Başqa saytlar sənin saytını iframe içində aça bilməz)
          { 
            key: 'X-Frame-Options', 
            value: 'DENY' 
          },
          // COOP Xətası üçün (Google Sign-In pop-up-larının təhlükəsiz işləməsi üçün)
          { 
            key: 'Cross-Origin-Opener-Policy', 
            value: 'same-origin-allow-popups' 
          },
          // Brauzerlərin fayl tiplərini səhv anlamaması üçün standart qorunma
          { 
            key: 'X-Content-Type-Options', 
            value: 'nosniff' 
          },
          // CSP (XSS Xətaları üçün yenilənmiş zireh)
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; " +
                   "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://accounts.google.com https://www.gstatic.com https://appleid.cdn-apple.com https://js.stripe.com https://apis.google.com; " +
                   "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://www.gstatic.com; " +
                   "img-src 'self' data: https: blob:; " +
                   "font-src 'self' https://fonts.gstatic.com; " +
                   "frame-src 'self' https://accounts.google.com https://appleid.apple.com https://js.stripe.com; " +
                   "connect-src 'self' https://duneflame.com https://accounts.google.com https://www.gstatic.com https://dune-flame-backend-180239181668.me-central1.run.app https://api.stripe.com https://localhost:7190; " +
                   "object-src 'none'; " + // <-- "Missing object-src" xətasını silir
                   "base-uri 'self'; " +
                   "frame-ancestors 'none';" // <-- "frame-ancestors" xətasını silir
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          }
        ],
      },
    ];
  },
}

export default withNextIntl(nextConfig);