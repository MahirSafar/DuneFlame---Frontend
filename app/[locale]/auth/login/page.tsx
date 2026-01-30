import React, { Suspense } from "react"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import LoginForm from "@/components/auth/login-form"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const messages = (await import(`../../../../messages/${locale}.json`)).default
  const meta = messages.metadata?.login || messages.metadata?.auth || null

  return {
    title: meta?.title ?? messages.metadata?.home?.title,
    description: meta?.description ?? messages.metadata?.home?.description,
  }
}

export default async function Page() {
  const t = await getTranslations("common.actions")

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">{t("loading")}</div>}>
      <LoginForm />
    </Suspense>
  )
}
