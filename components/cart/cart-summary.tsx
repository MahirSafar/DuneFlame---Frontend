"use client"

import Link from "next/link"
import { Trash2 } from "lucide-react"
import { useCartStore } from "@/lib/cart-store"
import { getImageUrl } from "@/lib/utils"
import { useAuthStore } from "@/lib/auth-store"

export default function CartSummary() {
  const { accessToken } = useAuthStore()
  const { items, removeItem, updateQuantity, total } = useCartStore()
  const isAuthenticated = !!accessToken

  if (items.length === 0) {
    return (
      <div className="glass rounded-xl p-12 text-center">
        <p className="text-muted-foreground text-lg mb-6">Your cart is empty</p>
        <Link
          href="/products"
          className="inline-block px-6 py-3 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold rounded-lg transition-smooth"
        >
          Continue Shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/product/${item.slug || item.id}`}
            className="glass rounded-xl p-4 flex items-center justify-between group hover:shadow-lg transition-smooth"
          >
            <div className="flex items-center gap-4 flex-1">
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={getImageUrl(item.imageUrl) || ""}
                  alt={item.name}
                  className="w-20 h-20 object-cover rounded-lg"
                />
              ) : (
                <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900 dark:to-orange-900 rounded-lg flex items-center justify-center text-2xl">
                  ☕
                </div>
              )}
              <div>
                <h3 className="font-semibold text-primary dark:text-secondary group-hover:text-accent transition-smooth">
                  {item.name}
                </h3>
                <p className="text-sm text-muted-foreground">${item.price.toFixed(2)}</p>
              </div>
            </div>

            <div className="flex items-center gap-4" onClick={(e) => e.preventDefault()}>
              <div className="flex items-center border border-border rounded-lg">
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    updateQuantity(item.id, Math.max(1, item.quantity - 1), isAuthenticated)
                  }}
                  className="p-1 hover:bg-accent/10 transition-smooth"
                >
                  −
                </button>
                <span className="px-3 font-semibold">{item.quantity}</span>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    updateQuantity(item.id, item.quantity + 1, isAuthenticated)
                  }}
                  className="p-1 hover:bg-accent/10 transition-smooth"
                >
                  +
                </button>
              </div>

              <span className="w-20 text-right font-semibold text-primary dark:text-secondary">
                ${(item.price * item.quantity).toFixed(2)}
              </span>

              <button
                onClick={(e) => {
                  e.preventDefault()
                  removeItem(item.id, isAuthenticated)
                }}
                className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-smooth"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </Link>
        ))}
      </div>

      <div className="glass rounded-xl p-6 space-y-4">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span>${total().toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Shipping</span>
          <span>Free</span>
        </div>
        <div className="border-t border-border pt-4 flex justify-between font-bold text-primary dark:text-secondary text-lg">
          <span>Total</span>
          <span>${total().toFixed(2)}</span>
        </div>

        <Link
          href="/checkout"
          className="w-full px-6 py-3 bg-accent hover:bg-accent/90 text-accent-foreground font-bold rounded-lg transition-smooth flex items-center justify-center glow-accent"
        >
          Proceed to Checkout
        </Link>

        <Link
          href="/products"
          className="w-full px-6 py-3 border border-border hover:bg-muted rounded-lg transition-smooth text-center font-semibold"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  )
}
