"use client"

import { useState } from "react"
import { Heart, ShoppingCart } from "lucide-react"

interface ProductCardProps {
  id: string
  name: string
  price: number
  image: string
  roastLevel: string
  origin: string
}

export default function ProductCard({ id, name, price, image, roastLevel, origin }: ProductCardProps) {
  const [isFavorite, setIsFavorite] = useState(false)

  return (
    <div className="glass rounded-xl overflow-hidden group cursor-pointer transition-all duration-500 ease-in-out hover:glow-accent card-float card-depth">
      <div className="relative h-48 overflow-hidden bg-muted">
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent z-10 group-hover:from-black/40 transition-all duration-500 ease-in-out" />
        <div className="w-full h-full bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900 dark:to-orange-900 flex items-center justify-center group-hover:scale-105 transition-all duration-500 ease-in-out">
          <div className="text-6xl group-hover:animate-float">☕</div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-xs text-accent font-semibold uppercase tracking-wider">{origin}</p>
            <h3 className="text-lg font-bold text-primary dark:text-secondary text-balance group-hover:text-accent transition-smooth">
              {name}
            </h3>
          </div>
          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className="p-1.5 hover:bg-accent/10 rounded-lg transition-smooth scale-100 hover:scale-110"
          >
            <Heart
              size={18}
              fill={isFavorite ? "currentColor" : "none"}
              className={`transition-smooth ${isFavorite ? "text-accent" : ""}`}
            />
          </button>
        </div>

        <p className="text-sm text-muted-foreground mb-3 group-hover:text-muted-foreground/80 transition-smooth">
          {roastLevel} Roast
        </p>

        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-primary dark:text-secondary">${price}</span>
          <button className="p-2 bg-gradient-warm-btn text-accent-foreground rounded-lg transition-smooth scale-100 hover:scale-110 hover:shadow-lg">
            <ShoppingCart size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
