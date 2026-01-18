"use client"

import Link from "next/link"
import { ShoppingCart } from "lucide-react"
import { useAddToCart } from "@/hooks/use-add-to-cart"
import { getImageUrl } from "@/lib/utils"

interface ProductCardProps {
  id: string
  slug: string
  name: string
  price: number
  images?: { imageUrl: string; isMain: boolean; id?: string }[]
  roastLevel: string
  origin: string
}

export default function ProductCard({ id, slug, name, price, images, roastLevel, origin }: ProductCardProps) {
  const { addToCart } = useAddToCart()
  const rawMainImage = images?.find((i) => i.isMain)?.imageUrl || images?.[0]?.imageUrl
  const mainImage = rawMainImage ? getImageUrl(rawMainImage) : null
  const hasImage = Boolean(mainImage)

  const productUrl = slug ? `/product/${slug}` : `/product/${id}`

  const handleAddToCartClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addToCart({ id, slug, name, price, images })
  }

  return (
    <article className="group relative glass rounded-xl overflow-hidden card-float card-depth cursor-pointer transition-all duration-500 ease-in-out hover:-translate-y-1 hover:scale-[1.01] hover:shadow-2xl hover:glow-accent">
      <Link
        href={productUrl}
        className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <div className="relative h-48 overflow-hidden bg-muted">
          {hasImage && mainImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mainImage}
              alt={name}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900 dark:to-orange-900 flex items-center justify-center group-hover:scale-105 transition-all duration-500 ease-in-out">
              <div className="text-6xl group-hover:animate-float">☕</div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent z-10 group-hover:from-black/40 transition-all duration-500 ease-in-out" />
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-xs text-accent font-semibold uppercase tracking-wider">{origin}</p>
              <h3 className="text-lg font-bold text-primary dark:text-secondary text-balance group-hover:text-accent transition-smooth">
                {name}
              </h3>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-4 group-hover:text-muted-foreground/80 transition-smooth">
            {roastLevel} Roast
          </p>

          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-primary dark:text-secondary">${price}</span>
            <span className="text-sm font-semibold text-accent opacity-0 translate-x-2 transition-smooth group-hover:opacity-100 group-hover:translate-x-0">
              View details →
            </span>
          </div>
        </div>
      </Link>

      <button
        onClick={handleAddToCartClick}
        aria-label="Add to cart"
        className="absolute top-3 right-3 z-10 p-2 bg-background/70 backdrop-blur rounded-full border border-white/10 hover:border-accent transition-smooth hover:scale-110"
      >
        <ShoppingCart size={18} className="text-foreground" />
      </button>

      <div className="flex items-center justify-between px-4 pb-4 pt-2">
        <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Signature pick</span>
        <button
          onClick={handleAddToCartClick}
          className="p-2 bg-gradient-warm-btn text-accent-foreground rounded-lg transition-smooth scale-100 hover:scale-110 hover:shadow-lg"
        >
          <ShoppingCart size={18} />
        </button>
      </div>
    </article>
  )
}
