"use client"

import type React from "react"

import { useState } from "react"
import { Mail, ArrowRight, Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
import toast from "react-hot-toast"
import { subscribeToNewsletter } from "@/lib/services/newsletter"
import { getErrorMessage } from "@/lib/utils"

export default function Newsletter() {
  const t = useTranslations()
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setIsSubmitting(true)
    try {
      await subscribeToNewsletter({ email })
      toast.success(t("home.newsletter.success"))
      setEmail("")
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="glass rounded-3xl p-12 md:p-16">
        <div className="max-w-2xl">
          <h2 className="font-heading font-bold text-primary dark:text-secondary mb-4" style={{ fontSize: "24px" }}>{t('home.newsletter.title')}</h2>
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
              disabled={isSubmitting || !email}
              className="px-6 py-3 font-semibold rounded-lg transition-smooth flex items-center gap-2 btn-subscribe disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin w-4 h-4 mr-2" />
              ) : (
                <>
                  {t('home.newsletter.subscribe')}
                  <ArrowRight size={18} className="rtl:rotate-180" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}
