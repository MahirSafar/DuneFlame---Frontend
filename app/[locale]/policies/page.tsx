"use client"

import { useLocale, useTranslations } from "next-intl"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Mail, Phone, MapPin, Shield, FileText, Truck, RotateCcw, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface PolicySectionProps {
  title: string
  content: string
  icon?: React.ReactNode
}

interface PolicySectionWithSubProps {
  title: string
  subtitle?: string
  sections: Array<{
    title: string
    content: string
    subsections?: Array<{
      title: string
      content: string
    }>
  }>
}

function PolicySection({ title, content, icon }: PolicySectionProps) {
  const lines = content.split("\n")

  return (
    <div className="space-y-4">
      {icon && <div className="text-accent">{icon}</div>}
      <h3 className="text-xl font-semibold" style={{ color: "#4B2E2B" }}>
        {title}
      </h3>
      <div className="space-y-2 text-muted-foreground leading-relaxed">
        {lines.map((line, idx) => {
          if (line.trim() === "") return <div key={idx} className="h-2" />
          if (line.startsWith("•")) {
            return (
              <div key={idx} className="flex gap-3 ml-4">
                <span className="text-accent mt-1">•</span>
                <p>{line.substring(1).trim()}</p>
              </div>
            )
          }
          return <p key={idx}>{line}</p>
        })}
      </div>
    </div>
  )
}

function ContactSection() {
  const t = useTranslations("policies.contact")

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Email Card */}
        <Card className="border-l-4" style={{ borderLeftColor: "#1f6f78", backgroundColor: "rgb(253, 250, 247)" }}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Mail className="w-8 h-8 text-accent shrink-0 mt-1" />
              <div className="min-w-0">
                <h4 className="font-semibold mb-1" style={{ color: "#4B2E2B" }}>
                  {t("emailLabel")}
                </h4>
                <p className="text-muted-foreground word-break">{t("email")}</p>
                <p className="text-xs text-muted-foreground mt-2">{t("email_support")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Phone Card */}
        <Card className="border-l-4" style={{ borderLeftColor: "#1f6f78", backgroundColor: "rgb(253, 250, 247)" }}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Phone className="w-8 h-8 text-accent shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold mb-1" style={{ color: "#4B2E2B" }}>
                  {t("phoneLabel")}
                </h4>
                <p className="text-muted-foreground">{t("phone")}</p>
                <p className="text-xs text-muted-foreground mt-2">{t("phone_support")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Address and Hours */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-l-4" style={{ borderLeftColor: "#1f6f78", backgroundColor: "rgb(253, 250, 247)" }}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <MapPin className="w-8 h-8 text-accent shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold mb-1" style={{ color: "#4B2E2B" }}>
                  {t("addressLabel")}
                </h4>
                <p className="text-muted-foreground">{t("address")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4" style={{ borderLeftColor: "#1f6f78", backgroundColor: "rgb(253, 250, 247)" }}>
          <CardContent className="pt-6">
            <h4 className="font-semibold mb-3" style={{ color: "#4B2E2B" }}>
              {t("businessHours")}
            </h4>
            <div className="space-y-1 text-sm text-muted-foreground whitespace-pre-line">
              {t("hours")}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Support Info */}
      <Alert style={{ borderColor: "#1f6f78", backgroundColor: "rgba(31, 111, 120, 0.05)" }}>
        <AlertCircle className="h-4 w-4" style={{ color: "#1f6f78" }} />
        <AlertDescription style={{ color: "#1f6f78" }}>
          {t("responseTime")}
        </AlertDescription>
      </Alert>
    </div>
  )
}

function PrivacySection() {
  const t = useTranslations("policies.privacy")

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-muted-foreground mb-4">{t("lastUpdated")}</p>
        <p className="text-muted-foreground leading-relaxed">{t("intro")}</p>
      </div>

      {[1, 2, 3, 4, 5, 6, 7].map((num) => (
        <PolicySection
          key={num}
          title={t(`section${num}.title`)}
          content={t(`section${num}.content`)}
        />
      ))}
    </div>
  )
}

function TermsSection() {
  const t = useTranslations("policies.terms")

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-muted-foreground mb-4">{t("lastUpdated")}</p>
        <p className="text-muted-foreground leading-relaxed">{t("intro")}</p>
      </div>

      {[1, 2, 3, 4, 5, 6, 7].map((num) => (
        <PolicySection
          key={num}
          title={t(`section${num}.title`)}
          content={t(`section${num}.content`)}
        />
      ))}
    </div>
  )
}

function ShippingSection() {
  const t = useTranslations("policies.shipping")

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-muted-foreground mb-4">{t("lastUpdated")}</p>
        <p className="text-muted-foreground leading-relaxed">{t("intro")}</p>
      </div>

      {/* UAE Shipping */}
      <Card style={{ backgroundColor: "rgb(253, 250, 247)" }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2" style={{ color: "#4B2E2B" }}>
            <Truck className="w-5 h-5 text-accent" />
            {t("uae.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <PolicySection title={t("uae.rates")} content={`${t("uae.standard")}\n${t("uae.express")}\n${t("uae.freeShipping")}`} />
          <PolicySection title={t("uae.serviceAreas")} content={t("uae.serviceAreas")} />
          <PolicySection title={t("uae.processing")} content={t("uae.processing")} />
          <Alert style={{ borderLeftColor: "#1f6f78", backgroundColor: "rgba(31, 111, 120, 0.05)" }}>
            <AlertCircle className="h-4 w-4" style={{ color: "#1f6f78" }} />
            <AlertDescription style={{ color: "#1f6f78" }} className="ml-2">
              {t("uae.notes")}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* International GCC Shipping */}
      <Card style={{ backgroundColor: "rgb(253, 250, 247)" }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2" style={{ color: "#4B2E2B" }}>
            <Truck className="w-5 h-5 text-accent" />
            {t("gcc.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <PolicySection title={t("gcc.regions")} content={t("gcc.regions")} />
          <PolicySection title={t("gcc.rates")} content={`${t("gcc.standard")}\n${t("gcc.express")}`} />
          <PolicySection title={t("gcc.processing")} content={t("gcc.processing")} />
          <PolicySection title={t("gcc.customs")} content={t("gcc.customs")} />
          <Alert style={{ borderLeftColor: "#ff6b6b", backgroundColor: "rgba(255, 107, 107, 0.05)" }}>
            <AlertCircle className="h-4 w-4 text-destructive" />
            <AlertDescription className="ml-2 text-destructive">
              {t("gcc.restrictions")}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Additional Info */}
      <PolicySection title={t("tracking.title")} content={t("tracking.content")} />
      <PolicySection title={t("damaged.title")} content={t("damaged.content")} />
      <PolicySection title={t("delays.title")} content={t("delays.content")} />
    </div>
  )
}

function RefundSection() {
  const t = useTranslations("policies.refund")

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-muted-foreground mb-4">{t("lastUpdated")}</p>
        <p className="text-muted-foreground leading-relaxed">{t("intro")}</p>
      </div>

      <Alert style={{ borderColor: "#1f6f78", backgroundColor: "rgba(31, 111, 120, 0.05)" }}>
        <AlertCircle className="h-4 w-4" style={{ color: "#1f6f78" }} />
        <AlertDescription style={{ color: "#1f6f78" }}>
          {t("section1.content")}
        </AlertDescription>
      </Alert>

      {/* Return Conditions */}
      <Card style={{ backgroundColor: "rgb(253, 250, 247)" }}>
        <CardHeader>
          <CardTitle style={{ color: "#4B2E2B" }}>{t("section2.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-semibold mb-3" style={{ color: "#4B2E2B" }}>
              ✅ {t("section2.eligibility")}
            </h4>
            <div className="space-y-2 text-muted-foreground">
              {t("section2.items").split("\n").map((item, idx) => (
                <div key={idx} className="flex gap-3 ml-4">
                  <span className="text-accent">•</span>
                  <span>{item.substring(1).trim()}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t pt-6">
            <h4 className="font-semibold mb-3 text-destructive">
              ❌ {t("section2.notEligible")}
            </h4>
            <div className="space-y-2 text-muted-foreground">
              {t("section2.exclude").split("\n").map((item, idx) => (
                <div key={idx} className="flex gap-3 ml-4">
                  <span className="text-destructive">•</span>
                  <span>{item.substring(1).trim()}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t pt-6">
            <p className="text-sm text-muted-foreground italic">{t("section2.refundTime")}</p>
          </div>
        </CardContent>
      </Card>

      {/* Cancellation */}
      <PolicySection title={t("section3.title")} content={t("section3.content")} />

      {/* Return Steps */}
      <Card style={{ backgroundColor: "rgb(253, 250, 247)" }}>
        <CardHeader>
          <CardTitle style={{ color: "#4B2E2B" }}>{t("section4.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-muted-foreground">
            {t("section4.steps").split("\n").map((step, idx) => (
              <div key={idx} className="flex gap-3">
                <span
                  className="font-semibold shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm text-white"
                  style={{ backgroundColor: "#1f6f78" }}
                >
                  {idx + 1}
                </span>
                <p>{step}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Defective Items */}
      <Alert style={{ borderColor: "#22c55e", backgroundColor: "rgba(34, 197, 94, 0.05)" }}>
        <AlertCircle className="h-4 w-4" style={{ color: "#22c55e" }} />
        <AlertDescription style={{ color: "#22c55e" }} className="ml-2">
          <p className="font-semibold mb-1">{t("section5.title")}</p>
          <p>{t("section5.content")}</p>
        </AlertDescription>
      </Alert>

      {/* Shipping Costs */}
      <PolicySection title={t("section6.title")} content={t("section6.content")} />

      {/* Contact */}
      <Card style={{ backgroundColor: "rgb(253, 250, 247)" }}>
        <CardContent className="pt-6">
          <h4 className="font-semibold mb-4" style={{ color: "#4B2E2B" }}>
            {t("section7.title")}
          </h4>
          <div className="space-y-2 text-muted-foreground whitespace-pre-line">
            {t("section7.content")}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function PoliciesPage() {
  const locale = useLocale()
  const t = useTranslations("policies")
  const isArabic = locale === "ar"
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<string>("contact")

  useEffect(() => {
    const tabParam = searchParams.get("tab")
    if (tabParam && ["contact", "privacy", "terms", "shipping", "refund"].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [searchParams])

  return (
    <div dir={isArabic ? "rtl" : "ltr"} className="min-h-screen" style={{ backgroundColor: "#faf9f7" }}>
      {/* Hero Section */}
      <div
        className="py-12 md:py-16"
        style={{
          background: "linear-gradient(135deg, rgba(31, 111, 120, 0.15) 0%, rgba(43, 27, 19, 0.05) 100%)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Shield className="w-8 h-8" style={{ color: "#1f6f78" }} />
              <h1 className="text-4xl md:text-5xl font-bold" style={{ color: "#4B2E2B" }}>
                {t("pageTitle")}
              </h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t("pageDescription")}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Tabs Navigation */}
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 gap-2 mb-8 h-auto p-2 bg-white border border-border">
            <TabsTrigger value="contact" className="text-xs sm:text-sm py-2">
              {t("sections.contact")}
            </TabsTrigger>
            <TabsTrigger value="privacy" className="text-xs sm:text-sm py-2">
              {t("sections.privacy")}
            </TabsTrigger>
            <TabsTrigger value="terms" className="text-xs sm:text-sm py-2">
              {t("sections.terms")}
            </TabsTrigger>
            <TabsTrigger value="shipping" className="text-xs sm:text-sm py-2">
              {t("sections.shipping")}
            </TabsTrigger>
            <TabsTrigger value="refund" className="text-xs sm:text-sm py-2">
              {t("sections.refund")}
            </TabsTrigger>
          </TabsList>

          {/* Contact Tab */}
          <TabsContent value="contact" className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold mb-2" style={{ color: "#4B2E2B" }}>
                {t("contact.title")}
              </h2>
              <p className="text-muted-foreground">{t("contact.subtitle")}</p>
            </div>
            <ContactSection />
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy" className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold mb-2" style={{ color: "#4B2E2B" }}>
                {t("privacy.title")}
              </h2>
            </div>
            <Card style={{ backgroundColor: "rgb(253, 250, 247)" }}>
              <CardContent className="pt-8 space-y-8">
                <PrivacySection />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Terms Tab */}
          <TabsContent value="terms" className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold mb-2" style={{ color: "#4B2E2B" }}>
                {t("terms.title")}
              </h2>
            </div>
            <Card style={{ backgroundColor: "rgb(253, 250, 247)" }}>
              <CardContent className="pt-8 space-y-8">
                <TermsSection />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Shipping Tab */}
          <TabsContent value="shipping" className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold mb-2" style={{ color: "#4B2E2B" }}>
                {t("shipping.title")}
              </h2>
            </div>
            <ShippingSection />
          </TabsContent>

          {/* Refund Tab */}
          <TabsContent value="refund" className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold mb-2" style={{ color: "#4B2E2B" }}>
                {t("refund.title")}
              </h2>
            </div>
            <RefundSection />
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer CTA */}
      <div className="bg-white border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4">
            <h3 className="text-2xl font-bold" style={{ color: "#4B2E2B" }}>
              {t("footerCta.title")}
            </h3>
            <p className="text-muted-foreground mb-6">
              {t("footerCta.description")}
            </p>
            <a
              href="mailto:info@duneflame.com"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition-all hover:scale-105"
              style={{ backgroundColor: "#1f6f78" }}
            >
              <Mail className="w-4 h-4" />
              {t("footerCta.button")}
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
