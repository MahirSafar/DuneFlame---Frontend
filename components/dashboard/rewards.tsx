"use client"

import { useTranslations, useLocale } from "next-intl"
import type { MyRewards } from "@/lib/services/rewards"
import Image from "next/image"

interface RewardsProps {
  rewards: MyRewards
}

export default function Rewards({ rewards }: RewardsProps) {
  const t = useTranslations("dashboard")
  const locale = useLocale()
  const isArabic = locale === "ar"
  // Debug

  // Get balance - handle null/undefined
  const balance = rewards?.stats?.balance ?? 0

  return (
    <div className="w-full" dir={isArabic ? "rtl" : "ltr"}>
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8" style={{ boxShadow: "0 8px 16px rgba(230, 211, 191, 0.5)" }}>
        {/* Header */}
        <div className={`flex items-center gap-3 mb-6 ${isArabic ? "flex-row-reverse" : ""}`}>
          <div className="p-3">
          <Image src="/logo.svg" alt="Flame Points" width={56} height={56} quality={60} />
          </div>
          <div>
            <h3 className="text-lg font-bold uppercase" style={{ color: '#2b1b13' }}>{t("flamePoints")}</h3>
          </div>
        </div>

        {/* Balance Display */}
        <div className="text-center py-6">
          <p className="text-5xl font-bold" style={{ color: '#cc3323' }}>
            {balance.toFixed(2)}
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">{t("availablePoints")}</p>
        </div>
      </div>
    </div>
  )
}
