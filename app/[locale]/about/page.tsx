import type { Metadata } from "next"
import Navbar from "@/components/layout/navbar"
import Footer from "@/components/layout/footer"
import Newsletter from "@/components/home/newsletter"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const messages = (await import(`../../../messages/${locale}.json`)).default
  const meta = messages.metadata?.about

  return {
    title: meta?.title,
    description: meta?.description,
  }
}

export default function AboutPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-16">
            <h1 className="font-bold text-primary dark:text-secondary mb-6 uppercase" style={{ fontSize: '24px' }}>OUR STORY</h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              DuneFlame was born from a passion for exceptional coffee and a love of craftsmanship. In 2018, our founder
              traveled across the world's most renowned coffee-producing regions, connecting with farmers and roasters
              who shared our vision of quality.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <div className="glass rounded-2xl p-8">
              <h3 className="font-bold text-primary dark:text-secondary mb-4 uppercase" style={{ fontSize: '24px' }}>OUR MISSION</h3>
              <p className="text-muted-foreground leading-relaxed">
                To bring the world's finest single-origin coffees directly to your cup, celebrating the unique terroir
                and craftsmanship of each origin while supporting sustainable farming practices.
              </p>
            </div>

            <div className="glass rounded-2xl p-8">
              <h3 className="font-bold text-primary dark:text-secondary mb-4 uppercase" style={{ fontSize: '24px' }}>OUR VALUES</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li>✓ Sustainability and Fair Trade practices</li>
                <li>✓ Direct relationships with coffee farmers</li>
                <li>✓ Small-batch artisan roasting</li>
                <li>✓ Transparent sourcing</li>
              </ul>
            </div>
          </div>

          <div className="glass rounded-2xl p-8 mb-16">
            <h3 className="font-bold text-primary dark:text-secondary mb-6 uppercase" style={{ fontSize: '24px' }}>SUSTAINABILITY</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We're committed to environmental responsibility. All our packaging is compostable, and 5% of every
              purchase goes toward reforestation projects in coffee-producing regions. We work exclusively with farms
              that practice shade-growing and water conservation.
            </p>
            <div className="grid grid-cols-3 gap-4 mt-8">
              <div className="text-center">
                <p className="text-3xl font-bold" style={{ color: 'rgb(56, 109, 118)' }}>50K+</p>
                <p className="text-sm font-semibold" style={{ color: 'rgb(56, 109, 118)' }}>Trees Planted</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold" style={{ color: 'rgb(56, 109, 118)' }}>200+</p>
                <p className="text-sm font-semibold" style={{ color: 'rgb(56, 109, 118)' }}>Partner Farms</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold" style={{ color: 'rgb(56, 109, 118)' }}>100%</p>
                <p className="text-sm font-semibold" style={{ color: 'rgb(56, 109, 118)' }}>Sustainable</p>
              </div>
            </div>
          </div>
        </div>
        <Newsletter />
      </div>
      <Footer />
    </main>
  )
}
