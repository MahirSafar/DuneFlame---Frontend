"use client"

import { useState } from "react"
import { Heart, ShoppingCart, Star } from "lucide-react"
import type { Product } from "@/lib/mock-data"

interface ProductDetailProps {
  product: Product
}

export default function ProductDetail({ product }: ProductDetailProps) {
  const [quantity, setQuantity] = useState(1)
  const [isFavorite, setIsFavorite] = useState(false)

  const handleAddToCart = () => {
    console.log(`Added ${quantity} of ${product.name} to cart`)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Image Section */}
      <div className="flex items-center justify-center">
        <div className="glass rounded-2xl p-8 w-full aspect-square flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-flame-apricot/50 to-flame-caramel/50 dark:from-flame-caramel/30 dark:to-flame-red/30" />
          <div className="relative text-8xl">☕</div>
        </div>
      </div>

      {/* Details Section */}
      <div className="flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-accent font-semibold text-sm uppercase tracking-wider mb-2">{product.origin}</p>
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

          {/* Specs */}
          <div className="glass rounded-xl p-6 mb-6">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase mb-1">Roast Level</p>
                <p className="font-semibold text-primary dark:text-secondary">{product.roastLevel}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase mb-1">Strength</p>
                <div className="flex gap-1">
                  {[...Array(10)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-2 w-1 rounded-full ${i < product.strength ? "bg-accent" : "bg-muted"}`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase mb-2">Flavor Notes</p>
              <div className="flex flex-wrap gap-2">
                {product.notes.map((note) => (
                  <span key={note} className="px-3 py-1 bg-accent/10 text-accent text-sm rounded-full font-medium">
                    {note}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Purchase Section */}
        <div className="glass rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-3xl font-bold text-primary dark:text-secondary">${product.price}</span>
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
            <span className="text-lg font-semibold text-accent">${(product.price * quantity).toFixed(2)}</span>
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
