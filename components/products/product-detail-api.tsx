"use client";

import { useState } from "react";
import { ShoppingCart, Star, Zap } from "lucide-react";
import type { ProductResponse } from "@/lib/services/products";
import { useAddToCart } from "@/hooks/use-add-to-cart";
import { useCurrency } from "@/lib/currency-context";
import { getAvailableWeights, resolvePrice, type ProductWithPricing } from "@/lib/currency-utils";
import { FormattedPrice } from "@/components/currency/formatted-price";
import { EMPTY_GUID } from "@/lib/cart-store";
import { handleBuyNow } from "@/lib/services/payments";
import { useToast } from "@/hooks/use-toast";

export default function ProductDetailApi({ product }: { product: ProductResponse }) {
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const { addToCart } = useAddToCart();
  const { currency } = useCurrency();
  const { toast } = useToast();
  
  // Get price for display
  const displayPrice = product.variants?.[0]?.price ?? 0;

  const mainImage = product.images?.find((i) => i.isMain)?.imageUrl || product.images?.[0]?.imageUrl;

  const handleAddToCart = () => {
    addToCart(product, quantity, {
      productVariantId: product.variants?.[0]?.id || "",
      price: displayPrice,
      sku: product.variants?.[0]?.sku || "",
      attributes: [],
    });
  };

  const handleBuyNowClick = async () => {
    try {
      setIsLoading(true);
      const productVariantId = product.variants?.[0]?.id;
      if (!productVariantId) {
        throw new Error("No pricing available for this product");
      }
      await handleBuyNow(product.id, productVariantId, quantity);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process purchase",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="flex items-center justify-center">
        <div className="glass rounded-2xl p-8 w-full aspect-square flex items-center justify-center relative overflow-hidden">
          {mainImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mainImage} alt={product.name} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-linear-to-br from-amber-100 to-orange-100 dark:from-amber-900 dark:to-orange-900" />
          )}
          <div className="relative text-8xl">☕</div>
        </div>
      </div>

      <div className="flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-accent font-semibold text-sm uppercase tracking-wider mb-2">{product.categoryName}</p>
              <h1 className="text-4xl font-bold text-primary dark:text-secondary">{product.name}</h1>
            </div>
            <button className="p-3 hover:bg-accent/10 rounded-lg transition-smooth">
              <ShoppingCart size={24} className="text-foreground" />
            </button>
          </div>

          <p className="text-muted-foreground text-lg mb-6">{product.description}</p>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} fill="currentColor" className="text-flame-caramel" />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">Popular choice</span>
          </div>
        </div>

        <div className="glass rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-3xl font-bold text-primary dark:text-secondary">
              <FormattedPrice amount={displayPrice} />
            </span>
            <span className="text-sm text-muted-foreground">In Stock</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center border border-border rounded-lg">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 hover:bg-accent/10 transition-smooth">
                −
              </button>
              <span className="px-4 font-semibold">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} className="p-2 hover:bg-accent/10 transition-smooth">
                +
              </button>
            </div>
            <span className="text-lg font-semibold text-accent">
              <FormattedPrice amount={displayPrice * quantity} />
            </span>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={(product.variants?.[0]?.stockQuantity ?? 0) <= 0 || isLoading}
            className="w-full px-6 py-3 bg-accent hover:bg-accent/90 disabled:opacity-70 text-accent-foreground font-bold rounded-lg transition-smooth flex items-center justify-center gap-2 glow-accent"
          >
            <ShoppingCart size={20} />
            Add to Cart
          </button>

          <button
            onClick={handleBuyNowClick}
            disabled={(product.variants?.[0]?.stockQuantity ?? 0) <= 0 || isLoading}
            className="w-full px-6 py-3 bg-primary hover:bg-primary/90 disabled:opacity-70 text-primary-foreground font-bold rounded-lg transition-smooth flex items-center justify-center gap-2"
          >
            <Zap size={20} />
            {isLoading ? "Processing..." : "Buy Now"}
          </button>
        </div>
      </div>
    </div>
  );
}
