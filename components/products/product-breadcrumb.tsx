import { Link } from "@/i18n/routing"
import { ChevronRight, Home } from "lucide-react"
import { getCategories, type ProductResponse } from "@/lib/services/products"

interface ProductBreadcrumbProps {
  product: ProductResponse
  locale: string
}

export default async function ProductBreadcrumb({ product, locale }: ProductBreadcrumbProps) {
  let categories: Awaited<ReturnType<typeof getCategories>> = []
  try {
    categories = await getCategories()
  } catch {
    // fail silently — breadcrumb is non-critical
  }

  const productCategory = categories.find((c) => c.id === product.categoryId)
  const parentCategory =
    productCategory?.parentCategoryId
      ? categories.find((c) => c.id === productCategory.parentCategoryId)
      : null

  // Skip generic "root" wrapper node
  const rootCategory =
    parentCategory && parentCategory.name.toLowerCase() !== "root" ? parentCategory : null
  const leafCategory =
    productCategory && productCategory.name.toLowerCase() !== "root" ? productCategory : null

  const productName =
    product.translations?.find((t) => t.languageCode === locale)?.name ||
    product.translations?.find((t) => t.languageCode === "en")?.name ||
    product.name

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6 flex-wrap"
    >
      <Link href="/" className="flex items-center gap-1 hover:text-foreground transition-colors">
        <Home size={14} />
        <span>Home</span>
      </Link>

      {rootCategory && (
        <>
          <ChevronRight size={14} className="shrink-0 opacity-50" />
          <Link
            href={rootCategory.slug ? `/shop?category=${rootCategory.slug}` : "/shop"}
            className="hover:text-foreground transition-colors capitalize"
          >
            {rootCategory.name}
          </Link>
        </>
      )}

      {leafCategory && leafCategory.id !== rootCategory?.id && (
        <>
          <ChevronRight size={14} className="shrink-0 opacity-50" />
          <Link
            href={leafCategory.slug ? `/shop?category=${leafCategory.slug}` : "/shop"}
            className="hover:text-foreground transition-colors capitalize"
          >
            {leafCategory.name}
          </Link>
        </>
      )}

      <ChevronRight size={14} className="shrink-0 opacity-50" />
      <span
        className="text-foreground font-medium truncate max-w-50"
        title={productName}
      >
        {productName}
      </span>
    </nav>
  )
}
