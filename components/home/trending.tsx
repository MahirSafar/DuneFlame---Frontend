import ProductCard from "@/components/products/product-card"
import type { ProductResponse } from "@/lib/services/products"
import { getTranslations } from "next-intl/server"
import { cookies } from "next/headers"

async function getTrendingProducts() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://dune-flame-backend-180239181668.me-central1.run.app';
    // Read currency from cookie so the backend returns currency-specific prices in variants
    const cookieStore = await cookies();
    const currency =
      cookieStore.get("df_currency")?.value ||
      cookieStore.get("NEXT_CURRENCY")?.value ||
      "AED";
    // Fetch with larger pageSize (50) to bypass grinders and guarantee coffee products are included
    const res = await fetch(`${baseUrl}/api/v1/products?pageNumber=1&pageSize=50`, {
      next: { revalidate: 1800 },
      headers: {
        Currency: currency,
        "X-Currency": currency,
      },
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch trending products: ${res.statusText}`);
    }
    const data = await res.json();
    // Filter for products with coffeeProfile (Coffee Beans category)
    const coffeeProducts = (data.items || []).filter((p: ProductResponse) => p.coffeeProfile);
    // Return exactly 4 coffee products
    return coffeeProducts.slice(0, 4);
  } catch (err) {
    console.error("Failed to fetch trending products:", err);
    return [];
  }
}

export default async function Trending() {
  const t = await getTranslations()
  // Only show coffee products in trending (already filtered in getTrendingProducts)
  const products = await getTrendingProducts();

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
          {products.map((product: ProductResponse, index: number) => {
            return (
              <ProductCard key={product.id} product={product} priority={index < 4} />
            )
          })}
        </div>
      )}
    </section>
  )
}
