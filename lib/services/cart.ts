import { apiFetch } from "../axios";

export interface CartItemDto {
  id: string;
  productId: string;
  variantId: string;
  productName: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  sku: string;
  attributes: string[];
  roastLevelName?: string;
  grindTypeName?: string;
  roastLevelId?: string;
  grindTypeId?: string;
}

export interface CartDto {
  id: string;
  totalAmount: number;
  items: CartItemDto[];
}

export const cartService = {
  // Səbəti gətir
  getCart: () => apiFetch<CartDto>("/cart"),
  
  // Məhsul əlavə et
  addItem: (productId: string, quantity: number) => 
    apiFetch<CartDto>("/cart/items", {
      method: "POST",
      body: JSON.stringify({ productId, quantity })
    }),

  // Məhsulu sil
  removeItem: (itemId: string) => 
    apiFetch<void>(`/cart/items/${itemId}`, { method: "DELETE" })
};
