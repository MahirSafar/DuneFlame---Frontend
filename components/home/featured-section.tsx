"use client"

import { ArrowRight } from "lucide-react"
import { useTranslations } from "next-intl"

interface FeaturedItem {
  id: string
  titleKey: string
  descriptionKey: string
  image?: string
  tagKey: string
}

const FEATURED_ITEMS: FeaturedItem[] = [
  {
    id: "1",
    titleKey: "home.featured.limitedEdition",
    descriptionKey: "home.featured.limitedEditionDesc",
    tagKey: "home.featured.newArrival",
  },
  {
    id: "2",
    titleKey: "home.featured.roastersSelection",
    descriptionKey: "home.featured.roastersSelectionDesc",
    tagKey: "home.featured.curated",
  },
]

export default function FeaturedSection() {
  const t = useTranslations()
  
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="text-center mb-12">
        <span className="text-accent font-semibold text-sm uppercase tracking-wider">{t('home.featured.discover')}</span>
        <h2 className="text-4xl md:text-5xl font-bold text-primary dark:text-secondary mt-2 leading-tight">
          {t('home.featured.title')} <span className="text-accent">{t('home.featured.titleAccent')}</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {FEATURED_ITEMS.map((item) => (
          <div key={item.id} className="glass rounded-2xl p-8 group cursor-pointer hover:glow-accent transition-smooth">
            <div className="flex flex-col justify-between h-full">
              <div>
                <span className="text-accent font-semibold text-xs uppercase tracking-wider">{t(item.tagKey)}</span>
                <h3 className="text-3xl font-bold text-primary dark:text-secondary mt-4 mb-2">{t(item.titleKey)}</h3>
                <p className="text-muted-foreground">{t(item.descriptionKey)}</p>
              </div>
              <div className="mt-6 flex items-center gap-2 text-accent group-hover:gap-4 transition-all">
                <span className="font-semibold">{t('common.actions.learnMore')}</span>
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform rtl:rotate-180" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
