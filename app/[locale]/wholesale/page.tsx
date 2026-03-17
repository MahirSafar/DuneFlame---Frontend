'use client'

// Note: Metadata moved to metadata.ts


import Navbar from "@/components/layout/navbar"
import Footer from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/routing"
import { useTranslations } from "next-intl"

export default function WholesalePage() {
  const t = useTranslations("wholesale")

  const wholesaleData = {
    title: t("title"),
    description: t("description"),
    benefits: [
      {
        id: 1,
        title: t("benefits.b1Title"),
        description: t("benefits.b1Desc")
      },
      {
        id: 2,
        title: t("benefits.b2Title"),
        description: t("benefits.b2Desc")
      },
      {
        id: 3,
        title: t("benefits.b3Title"),
        description: t("benefits.b3Desc")
      },
      {
        id: 4,
        title: t("benefits.b4Title"),
        description: t("benefits.b4Desc")
      },
      {
        id: 5,
        title: t("benefits.b5Title"),
        description: t("benefits.b5Desc")
      },
      {
        id: 6,
        title: t("benefits.b6Title"),
        description: t("benefits.b6Desc")
      }
    ],
    process: [
      {
        step: 1,
        title: t("process.s1Title"),
        description: t("process.s1Desc")
      },
      {
        step: 2,
        title: t("process.s2Title"),
        description: t("process.s2Desc")
      },
      {
        step: 3,
        title: t("process.s3Title"),
        description: t("process.s3Desc")
      },
      {
        step: 4,
        title: t("process.s4Title"),
        description: t("process.s4Desc")
      },
      {
        step: 5,
        title: t("process.s5Title"),
        description: t("process.s5Desc")
      }
    ]
  }

  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/10 to-transparent py-16 md:py-24 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold font-heading mb-4">
              {wholesaleData.title}
            </h1>
            <p className="text-lg text-foreground/80 max-w-2xl mx-auto mb-8">
              {wholesaleData.description}
            </p>
            <Button size="lg" asChild>
              <Link href="/contact">{t("getStarted")}</Link>
            </Button>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 md:py-24 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold font-heading mb-12 text-center">
              {t("whyPartner")}
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {wholesaleData.benefits.map((benefit) => (
                <div
                  key={benefit.id}
                  className="p-6 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors"
                >
                  <h3 className="text-xl font-semibold mb-3 text-foreground">
                    {benefit.title}
                  </h3>
                  <p className="text-foreground/70">
                    {benefit.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section className="py-16 md:py-24 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold font-heading mb-12 text-center">
              {t("ourProcess")}
            </h2>
            <div className="grid md:grid-cols-5 gap-4 md:gap-2">
              {wholesaleData.process.map((item, index) => (
                <div key={item.step} className="relative">
                  <div className="flex flex-col items-center">
                    {/* Step Circle */}
                    <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold mb-4">
                      {item.step}
                    </div>
                    
                    {/* Connector Line */}
                    {index < wholesaleData.process.length - 1 && (
                      <div className="hidden md:block absolute top-6 left-1/2 w-full h-0.5 bg-primary/20 transform translate-x-6 -translate-y-1/2"></div>
                    )}

                    {/* Content */}
                    <div className="text-center">
                      <h3 className="font-semibold text-foreground mb-1">
                        {item.title}
                      </h3>
                      <p className="text-sm text-foreground/60">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24 px-4 bg-gradient-to-r from-primary/10 to-accent/10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold font-heading mb-4">
              {t("ctaTitle")}
            </h2>
            <p className="text-lg text-foreground/80 mb-8">
              {t("ctaDesc")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/contact">{t("contactUs")}</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/coffee">{t("viewProducts")}</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </main>
  )
}
