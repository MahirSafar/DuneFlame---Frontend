"use client"

import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useLocale } from "next-intl"
import { Flame } from "lucide-react"

export default function NotFound() {
  const t = useTranslations("notFound")
  const locale = useLocale()
  const router = useRouter()

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-background via-background to-flame-apricot/5 relative overflow-hidden">
      {/* Glassmorphic background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-flame-apricot/10 rounded-full blur-3xl opacity-40 animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-oasis-teal/10 rounded-full blur-3xl opacity-40 animate-pulse" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-lg mx-auto px-4">
        {/* Glassmorphic card */}
        <div className="glass rounded-2xl p-8 md:p-12 text-center backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-2xl">
          {/* Animated flame icon */}
          <div className="mb-6 inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-flame-apricot/20 to-flame-caramel/20 rounded-full animate-bounce">
            <Flame className="w-10 h-10 text-flame-apricot" />
          </div>

          {/* Error code */}
          <div className="mb-4">
            <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-flame-apricot via-flame-caramel to-oasis-teal bg-clip-text text-transparent">
              {t("subtitle")}
            </h1>
          </div>

          {/* Title */}
          <h2 className="text-2xl md:text-3xl font-bold text-primary dark:text-secondary mb-3">
            {t("title")}
          </h2>

          {/* Description */}
          <p className="text-muted-foreground text-base md:text-lg mb-8 leading-relaxed">
            {t("description")}
          </p>

          {/* CTA Button */}
          <Button
            onClick={() => router.push(`/${locale}`)}
            className="bg-gradient-to-r from-flame-apricot to-flame-caramel hover:from-flame-apricot/90 hover:to-flame-caramel/90 text-white font-semibold px-8 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
            aria-label={t("backHome")}
          >
            {t("backHome")}
          </Button>

          {/* Additional helpful text */}
          <p className="mt-8 text-sm text-muted-foreground/70">
            {locale === "ar"
              ? "إذا استمرت هذه المشكلة، يرجى الاتصال بنا."
              : "If the problem persists, please contact us."}
          </p>
        </div>

        {/* Decorative elements */}
        <div className="mt-12 flex justify-center gap-2 opacity-30">
          <div className="w-2 h-2 bg-flame-apricot rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
          <div className="w-2 h-2 bg-flame-caramel rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
          <div className="w-2 h-2 bg-oasis-teal rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
        </div>
      </div>
    </div>
  )
}
