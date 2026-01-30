"use client"

import type React from "react"

import { useState } from "react"
import { Mail, ArrowRight } from "lucide-react"
import { useTranslations } from "next-intl"

export default function Newsletter() {
  const t = useTranslations()
  const [email, setEmail] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setEmail("")
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="glass rounded-3xl p-12 md:p-16">
        <div className="max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-bold text-primary dark:text-secondary mb-4">{t('home.newsletter.title')}</h2>
          <p className="text-muted-foreground mb-8">
            {t('home.newsletter.description')}
          </p>

          <form onSubmit={handleSubmit} className="flex gap-3">
            <div className="flex-1 relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <input
                type="email"
                placeholder={t('home.newsletter.placeholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-card text-foreground placeholder:text-muted-foreground rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent"
                required
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold rounded-lg transition-smooth flex items-center gap-2"
            >
              {t('home.newsletter.subscribe')}
              <ArrowRight size={18} className="rtl:rotate-180" />
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}
