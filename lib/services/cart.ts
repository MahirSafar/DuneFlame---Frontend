import { apiFetch } from "../api-client";

export interface CartItemDto {
  id: string;
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  imageUrl?: string;
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