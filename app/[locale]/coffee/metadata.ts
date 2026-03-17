import type { Metadata } from "next"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const messages = (await import(`../../../messages/${locale}.json`)).default
  const meta = messages.metadata?.coffee || messages.metadata?.products

  return {
    title: meta?.title || "Best Coffee – Duneflame",
    description: meta?.description || "Premium coffee from Duneflame",
  }
}
