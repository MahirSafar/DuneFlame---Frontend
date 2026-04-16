"use client"

import { useState } from "react"
import { Heart, ShoppingCart, Star } from "lucide-react"
import type { ProductResponse } from "@/lib/services/products"
import { useLocale } from "next-intl"

interface ProductDetailProps {
  product: ProductResponse
}

export default function ProductDetail({ product }: ProductDetailProps) {
  const locale = useLocale();
  const [quantity, setQuantity] = useState(1)
  const [isFavorite, setIsFavorite] = useState(false)

  const handleAddToCart = () => {
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Image Section */}
      <div className="flex items-center justify-center">
        <div className="glass rounded-2xl p-8 w-full aspect-square flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-br from-flame-apricot/50 to-flame-caramel/50 dark:from-flame-caramel/30 dark:to-flame-red/30" />
          <div className="relative text-8xl">☕</div>
        </div>
      </div>

      {/* Details Section */}
      <div className="flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-accent font-semibold text-sm uppercase tracking-wider mb-2">
                {product.coffeeProfile?.originName || product.brandName || product.categoryName || 'Product'}
              </p>
              <h1 className="text-4xl font-bold text-primary dark:text-secondary">{product.name}</h1>
            </div>
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className="p-3 hover:bg-accent/10 rounded-lg transition-smooth"
            >
              <Heart
                size={24}
                fill={isFavorite ? "currentColor" : "none"}
                className={isFavorite ? "text-accent" : ""}
              />
            </button>
          </div>

          <p className="text-muted-foreground text-lg mb-6">{product.description}</p>

          {/* Rating */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} fill="currentColor" className="text-flame-caramel" />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">(127 reviews)</span>
          </div>

          {/* Specs or Coffee Details */}
          {product.specifications && Object.keys(product.specifications).length > 0 ? (
            <div className="glass rounded-xl p-6 mb-6">
              <p className="text-xs text-muted-foreground font-semibold uppercase mb-4 tracking-wider">Technical Specifications</p>
              <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key} className="border-b border-border/50 pb-2">
                    <p className="text-xs text-muted-foreground uppercase mb-1">{key}</p>
                    <p className="font-semibold text-foreground">{String(value)}</p>
                  </div>
                ))}
              </div>
              {/* Equipment-specific block */}
              <div className="mt-4">
                <span className="inline-block px-3 py-1 rounded bg-accent/10 text-accent text-xs font-semibold uppercase tracking-wider">Equipment</span>
              </div>
            </div>
          ) : product.coffeeProfile ? (
            <div className="glass rounded-xl p-6 mb-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase mb-1">Roast Level</p>
                  <p className="font-semibold text-[#2b1b13] dark:text-[#2b1b13]">{product.coffeeProfile?.roastLevelNames?.[0] || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase mb-1">Grind Type</p>
                  <p className="font-semibold text-[#2b1b13] dark:text-[#2b1b13]">{product.coffeeProfile?.grindTypeNames?.[0] || 'N/A'}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase mb-2">Flavor Notes</p>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(product.coffeeProfile?.flavourNotes) && product.coffeeProfile?.flavourNotes.length > 0
                    ? product.coffeeProfile?.flavourNotes.map((note: any) => {
                        const translation = note.translations?.find((tr: any) => tr.languageCode === locale)
                          || note.translations?.find((tr: any) => tr.languageCode === 'en');
                        return (
                          <span key={note.id} className="px-3 py-1 bg-accent/10 text-accent text-sm rounded-full font-medium">
                            {translation?.name || note.name}
                          </span>
                        );
                      })
                    : null}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass rounded-xl p-6 mb-6">
              <p className="text-xs text-muted-foreground font-semibold uppercase mb-4 tracking-wider">No specifications available.</p>
            </div>
          )}
        </div>

        {/* Purchase Section */}
        <div className="glass rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-3xl font-bold text-primary dark:text-secondary">
              {product.variants?.[0]?.prices?.[0]?.currencyCode ? (
                <>
                  {product.variants[0].prices[0].currencyCode} {product.variants[0].prices[0].price}
                </>
              ) : (
                <>${product.variants?.[0]?.price || 'N/A'}</>
              )}
            </span>
            <span className="text-sm text-muted-foreground">In Stock</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center border border-border rounded-lg">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2 hover:bg-accent/10 transition-smooth"
              >
                −
              </button>
              <span className="px-4 font-semibold">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} className="p-2 hover:bg-accent/10 transition-smooth">
                +
              </button>
            </div>
            <span className="text-lg font-semibold text-accent">
              {product.variants?.[0]?.prices?.[0]?.currencyCode
                ? `${product.variants[0].prices[0].currencyCode} ${(product.variants[0].prices[0].price * quantity).toFixed(2)}`
                : `$${((product.variants?.[0]?.price || 0) * quantity).toFixed(2)}`}
            </span>
          </div>

          <button
            onClick={handleAddToCart}
            className="w-full px-6 py-3 bg-accent hover:bg-accent/90 text-accent-foreground font-bold rounded-lg transition-smooth flex items-center justify-center gap-2 glow-accent"
          >
            <ShoppingCart size={20} />
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  )
}
