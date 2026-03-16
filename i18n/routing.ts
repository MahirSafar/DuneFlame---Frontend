import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['en', 'ar'],
  defaultLocale: 'en',
  localePrefix: 'always'
});

// Export locales and types for convenience
export const locales = routing.locales as typeof routing.locales;
export type Locale = (typeof routing.locales)[number];

// Create type-safe navigation components
export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);
