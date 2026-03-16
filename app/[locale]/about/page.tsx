import type { Metadata } from "next"
import Navbar from "@/components/layout/navbar"
import Footer from "@/components/layout/footer"
import Newsletter from "@/components/home/newsletter"

import { getTranslations } from "next-intl/server"

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

export default async function AboutPage() {
  const t = await getTranslations("about")

  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-16">
            <h1 className="font-bold text-primary dark:text-secondary mb-6 uppercase" style={{ fontSize: '24px' }}>{t("title")}</h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              {t("story")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <div className="glass rounded-2xl p-8">
              <h3 className="font-bold text-primary dark:text-secondary mb-4 uppercase" style={{ fontSize: '24px' }}>{t("missionTitle")}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {t("missionText")}
              </p>
            </div>

            <div className="glass rounded-2xl p-8">
              <h3 className="font-bold text-primary dark:text-secondary mb-4 uppercase" style={{ fontSize: '24px' }}>{t("valuesTitle")}</h3>
              <ul className="space-y-3 text-muted-foreground">
                {t.raw("valuesSummary").map((item: string, i: number) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="glass rounded-2xl p-8 mb-16">
            <h3 className="font-bold text-primary dark:text-secondary mb-6 uppercase" style={{ fontSize: '24px' }}>{t("sustainabilityTitle")}</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              {t("sustainabilityText")}
            </p>
            <div className="grid grid-cols-3 gap-4 mt-8">
              <div className="text-center">
                <p className="text-3xl font-bold" style={{ color: 'rgb(56, 109, 118)' }}>50K+</p>
                <p className="text-sm font-semibold" style={{ color: 'rgb(56, 109, 118)' }}>{t("statsTrees")}</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold" style={{ color: 'rgb(56, 109, 118)' }}>200+</p>
                <p className="text-sm font-semibold" style={{ color: 'rgb(56, 109, 118)' }}>{t("statsFarms")}</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold" style={{ color: 'rgb(56, 109, 118)' }}>100%</p>
                <p className="text-sm font-semibold" style={{ color: 'rgb(56, 109, 118)' }}>{t("statsSust")}</p>
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
