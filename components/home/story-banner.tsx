"use client"

import { useTranslations } from "next-intl"

export default function StoryBanner() {
  const t = useTranslations()
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="glass rounded-3xl p-12 md:p-16 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-orange-500/20 to-transparent rounded-full blur-3xl" />

        <div className="relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-primary dark:text-secondary mb-6 leading-tight">
            {t('home.story.title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mb-8 leading-relaxed">
            {t('home.story.description')}
          </p>
          <button className="px-8 py-3 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold rounded-lg transition-smooth">
            {t('home.story.cta')}
          </button>
        </div>
      </div>
    </section>
  )
}
