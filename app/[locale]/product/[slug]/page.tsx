import type { Metadata } from "next"
import { Link } from "@/i18n/routing"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import Footer from "@/components/layout/footer"
import Navbar from "@/components/layout/navbar"
import Newsletter from "@/components/home/newsletter"
import ProductDetailView from "@/components/products/product-detail-view"
import ProductBreadcrumb from "@/components/products/product-breadcrumb"
import RelatedProducts from "@/components/products/related-products"
import type { ApiError } from "@/lib/axios"
import { setApiClientLocale } from "@/lib/axios"
import { getProduct, type ProductResponse } from "@/lib/services/products"
import { getImageUrl } from "@/lib/utils"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>
}): Promise<Metadata> {
  const { slug, locale } = await params

  let product: ProductResponse | null = null
  try {
    setApiClientLocale(locale)
    product = await getProduct(slug)
  } catch {
    return {
      title: "Product Not Found | DuneFlame",
    }
  }

  if (!product) {
    return {
      title: "Product Not Found | DuneFlame",
    }
  }

  const isCoffee = !!product.coffeeProfile;
  const productType = isCoffee ? "Coffee" : "Equipment";

  const translatedName =
    product.translations?.find((t) => t.languageCode === locale)?.name ||
    product.name ||
    `DuneFlame ${productType}`
  const translatedDescription =
    product.translations?.find((t) => t.languageCode === locale)?.description ||
    product.description ||
    `Premium ${productType} by DuneFlame`

  const rawMainImage =
    product.images?.find((i) => i.isMain)?.imageUrl || product.images?.[0]?.imageUrl || null
  const mainImageUrl = rawMainImage ? getImageUrl(rawMainImage) : null

  return {
    title: `${translatedName} | DuneFlame ${productType}`,
    description: translatedDescription,
    openGraph: {
      title: `${translatedName} | DuneFlame ${productType}`,
      description: translatedDescription,
      url: `https://duneflame.com/${locale}/product/${slug}`,
      siteName: "DuneFlame",
      type: "website",
      locale,
      images: mainImageUrl ? [{ url: mainImageUrl }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `${translatedName} | DuneFlame ${productType}`,
      description: translatedDescription,
      images: mainImageUrl ? [mainImageUrl] : [],
    },
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>
}) {
  const { slug, locale } = await params
  const t = await getTranslations("products")

  let product: ProductResponse | null = null
  try {
    setApiClientLocale(locale)
    product = await getProduct(slug)
  } catch (error) {
    const status = (error as ApiError | undefined)?.status
    if (status === 404) {
      notFound()
    }
    throw error
  }

  if (!product) {
    notFound()
  }

  const isCoffee = !!product.coffeeProfile;
  const backLink = isCoffee ? "/coffee" : "/coffee";
  const backLabel = isCoffee ? t("backToCoffee") : t("backToEquipment");

  return (
    <main className="min-h-screen flex flex-col bg-linear-to-b from-background to-background/70">
      <Navbar />
      <div className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link
            href={backLink}
            className="text-accent hover:text-accent/80 font-semibold mb-8 inline-flex items-center gap-2 transition-smooth"
          >
            {backLabel}
          </Link>
          <ProductBreadcrumb product={product} locale={locale} />
          <ProductDetailView product={product} />
          {product.categoryId && (
            <RelatedProducts categoryId={product.categoryId} currentProductId={product.id} />
          )}
        </div>
        <Newsletter />
      </div>
      <Footer />
    </main>
  )
}
