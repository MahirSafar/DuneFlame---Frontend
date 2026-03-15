"use client"

import type React from "react"
import { useState } from "react"
import { useTranslations } from "next-intl"
import { useLocale } from "next-intl"
import Navbar from "@/components/layout/navbar"
import Footer from "@/components/layout/footer"
import Newsletter from "@/components/home/newsletter"
import { Mail, Phone, MapPin, Send, Loader2 } from "lucide-react"
import toast from "react-hot-toast"
import { submitContactForm } from "@/lib/services/contact"
import { getErrorMessage } from "@/lib/utils"

export default function ContactPage() {
  const t = useTranslations("pages.contact")
  const locale = useLocale()
  const isArabic = locale === "ar"
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", subject: "", message: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setIsSubmitting(true)

      await submitContactForm({
        Name: formData.name,
        Email: formData.email,
        Subject: formData.subject,
        Message: `Phone: ${formData.phone}\n\n${formData.message}`,
      })

      toast.success(t("successMessage"))
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" })
    } catch (err) {
      toast.error(getErrorMessage(err) || t("errorMessage"))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-16">
            <h1 className="font-bold text-primary dark:text-secondary mb-4 uppercase" style={{ fontSize: '32px' }}>{t("pageTitle")}</h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="glass rounded-xl p-8 text-center">
              <Mail className="w-8 h-8 text-accent mx-auto mb-4" />
              <h3 className="font-bold mb-2" style={{ color: '#2b1b13' }}>{t("emailLabel")}</h3>
              <a href="mailto:hello@duneflame.com" className="hover:underline" style={{ color: '#2b1b13' }}>
                info@duneflame.com
              </a>
            </div>
            <div className="glass rounded-xl p-8 text-center">
              <Phone className="w-8 h-8 text-accent mx-auto mb-4" />
              <h3 className="font-bold mb-2" style={{ color: '#2b1b13' }}>{t("phoneLabel")}</h3>
              <a href="tel:+9715251450202" className="hover:underline" style={{ color: '#2b1b13' }}>
                {t("phone")}
              </a>
            </div>
            <div className="glass rounded-xl p-8 text-center">
              <MapPin className="w-8 h-8 text-accent mx-auto mb-4" />
              <h3 className="font-bold mb-2" style={{ color: '#2b1b13' }}>{t("locationLabel")}</h3>
              <p style={{ color: '#2b1b13' }}>{t("location")}</p>
            </div>
          </div>

          <div className="glass rounded-2xl p-8">
            <h2 className="font-bold text-primary dark:text-secondary mb-6 uppercase" style={{ fontSize: '24px' }}>{t("formTitle")}</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  name="name"
                  placeholder={t("namePlaceholder")}
                  value={formData.name}
                  onChange={handleChange}
                  className="px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  required
                />
                <input
                  type="email"
                  name="email"
                  placeholder={t("emailPlaceholder")}
                  value={formData.email}
                  onChange={handleChange}
                  className="px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  required
                />
              </div>

              <input
                type="tel"
                name="phone"
                placeholder={t("phonePlaceholder")}
                value={formData.phone}
                onChange={handleChange}
                dir={isArabic ? "rtl" : "ltr"}
                className="w-full px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                required
              />

              <input
                type="text"
                name="subject"
                placeholder={t("subjectPlaceholder")}
                value={formData.subject}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                required
              />

              <textarea
                name="message"
                placeholder={t("messagePlaceholder")}
                value={formData.message}
                onChange={handleChange}
                rows={6}
                className="w-full px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                required
              />

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-6 py-3 hover:opacity-90 disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-smooth flex items-center justify-center gap-2 glow-accent"
                style={{ backgroundColor: '#2b1b13' }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={20} />
                    {t("sendingButton")}
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    {t("sendButton")}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
        <Newsletter />
      </div>
      <Footer />
    </main>
  )
}
