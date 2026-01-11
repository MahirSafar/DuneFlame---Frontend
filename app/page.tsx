import Navbar from "@/components/layout/navbar"
import Footer from "@/components/layout/footer"
import BentoHero from "@/components/home/bento-hero"
import FeaturedSection from "@/components/home/featured-section"
import Categories from "@/components/home/categories"
import StoryBanner from "@/components/home/story-banner"
import Trending from "@/components/home/trending"
import Newsletter from "@/components/home/newsletter"

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1">
        <BentoHero />
        <FeaturedSection />
        <Categories />
        <StoryBanner />
        <Trending />
        <Newsletter />
      </div>
      <Footer />
    </main>
  )
}
