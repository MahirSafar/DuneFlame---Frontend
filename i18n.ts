import { getRequestConfig } from "next-intl/server";
import { notFound } from 'next/navigation';

export const locales = ["en", "ar"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export default getRequestConfig(async ({ locale }) => {
  // Gələn locale siyahıda yoxdursa, 404 qaytar
  if (!locales.includes(locale as any)) notFound();

  return {
    // 'as string' istifadə edərək TS-ə bunun undefined olmadığını təsdiqləyirik
    locale: locale as string,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
