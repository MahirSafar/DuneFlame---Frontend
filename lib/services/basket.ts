import { apiFetch } from "../axios";

export interface BasketItem {
  id?: string;
  productId: string;
  variantId: string;
  productName: string;
  slug: string;
  price: number;
  quantity: number;
  imageUrl: string;
  roastLevelId?: string;
  roastLevelName?: string;
  grindTypeId?: string;
  grindTypeName?: string;
}

export interface CustomerBasketDto {
  id: string;
  customerId: string;
  items: BasketItem[];
  createdAt?: string;
  updatedAt?: string;
}

// Request payload for updating basket (includes ID for guest baskets)
export interface UpdateBasketPayload {
  id: string;
  items: BasketItem[];
  currencyCode?: string;
}

export const basketService = {
  getBasket: (id: string) => apiFetch<CustomerBasketDto>(`/basket/${id}`, { 
    method: "GET",
  }),

  getBasketMe: (token: string) => apiFetch<CustomerBasketDto>(`/basket/me`, { 
    method: "GET",
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  }),

  updateBasket: (payload: UpdateBasketPayload | BasketItem[]) => {
    const basketPayload = Array.isArray(payload)
      ? {
          id: "client-update",
          items: payload,
        }
      : payload

    return apiFetch<CustomerBasketDto>(`/basket`, {
      method: "POST",
      body: JSON.stringify({
        id: basketPayload.id,
        items: basketPayload.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          variantId: item.variantId,
          productName: item.productName,
          slug: item.slug,
          price: item.price,
          quantity: item.quantity,
          imageUrl: item.imageUrl,
          roastLevelId: item.roastLevelId,
          roastLevelName: item.roastLevelName,
          grindTypeId: item.grindTypeId,
          grindTypeName: item.grindTypeName,
        })),
      }),
    })
  },

  deleteBasketItem: (basketId: string, itemId: string) =>
    apiFetch<void>(`/basket/${basketId}/${itemId}`, { method: "DELETE" }),

  clearBasket: (basketId: string) =>
    apiFetch<CustomerBasketDto>(`/basket`, {
      method: "POST",
      body: JSON.stringify({ 
        id: basketId,
        items: [] 
      }),
    }),
};
