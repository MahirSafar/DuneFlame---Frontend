import React, { Suspense } from "react"
import { getTranslations } from "next-intl/server"
import UnifiedAuth from "@/components/auth/unified-auth"

export default async function RegisterPage() {
  const t = await getTranslations("common.actions")

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">{t("loading")}</div>}>
      <UnifiedAuth initialMode="register" />
    </Suspense>
  )
}
