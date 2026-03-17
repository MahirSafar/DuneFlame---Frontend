import ProductCard from "@/components/products/product-card"
import type { ProductResponse } from "@/lib/services/products"
import { getTranslations } from "next-intl/server"

// Helper function to convert roast level number to descriptive text
const getRoastLevelText = (level: number): string => {
  if (level <= 3) return "Light"
  if (level <= 6) return "Medium"
  return "Dark"
}

async function getTrendingProducts() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://dune-flame-backend-180239181668.me-central1.run.app';
    const res = await fetch(`${baseUrl}/api/v1/products?pageNumber=1&pageSize=4`, {
      next: { revalidate: 3600 }
    });
    
    if (!res.ok) {
      throw new Error(`Failed to fetch trending products: ${res.statusText}`);
    }
    
    const data = await res.json();
    return (data.items || []) as ProductResponse[];
  } catch (err) {
    console.error("Failed to fetch trending products:", err);
    return [];
  }
}

export default async function Trending() {
  const t = await getTranslations()
  const products = await getTrendingProducts()

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="flex justify-between items-center mb-12">
        <div>
          <span className="text-espresso-brown font-heading font-semibold uppercase tracking-wider" style={{ fontSize: "24px" }}>{t('home.trending.title')}</span>
        </div>
        <a
          href="/coffee"
          className="text-espresso-brown font-heading font-semibold hover:gap-2 flex items-center gap-1 transition-smooth group"
        >
          {t('common.actions.viewDetails')}
          <span className="group-hover:translate-x-1 transition-transform rtl:rotate-180">→</span>
        </a>
      </div>

      {products.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass rounded-xl h-80 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product, index) => {
            return (
              <ProductCard key={product.id} product={product} priority={index < 4} />
            )
          })}
        </div>
      )}
    </section>
  )
}
