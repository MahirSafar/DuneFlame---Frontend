import { redirect } from "@/i18n/routing";
import type { Locale } from "@/i18n/routing"

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  // Consolidate to the single canonical login page
  redirect({ href: "/auth/login", locale: locale as Locale });
}
