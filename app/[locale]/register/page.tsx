import React, { Suspense } from "react"
import { getTranslations } from "next-intl/server"
import RegisterForm from "@/components/auth/register-form"

export default async function RegisterPage() {
  const t = await getTranslations("common.actions")

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">{t("loading")}</div>}>
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <RegisterForm />
      </div>
    </Suspense>
  )
}
