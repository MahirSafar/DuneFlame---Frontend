import type { Metadata } from "next"
import Navbar from "@/components/layout/navbar"
import Footer from "@/components/layout/footer"
import StoryBanner from "@/components/home/story-banner"
import Trending from "@/components/home/trending"
import Newsletter from "@/components/home/newsletter"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const messages = (await import(`../../messages/${locale}.json`)).default
  const meta = messages.metadata?.home

  return {
    title: meta?.title,
    description: meta?.description,
  }
}

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1">
        <Trending />
        <StoryBanner />
        <Newsletter />
      </div>
      <Footer />
    </main>
  )
}
