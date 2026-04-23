import { apiFetch } from "../axios";

export interface BasketItem {
  id?: string;
  productId: string;
  productVariantId: string;
  productName: string;
  slug: string;
  price: number;
  quantity: number;
  imageUrl: string;
  sku: string;
  attributes: string[];
  roastLevelId?: string | null;
  roastLevelName?: string | null;
  grindTypeId?: string | null;
  grindTypeName?: string | null;
}

export interface CustomerBasketDto {
  id: string;
  items: BasketItem[];
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
          id: "me",
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
          productVariantId: item.productVariantId,
          productName: item.productName,
          slug: item.slug,
          price: item.price,
          quantity: item.quantity,
          imageUrl: item.imageUrl,
          sku: item.sku,
          attributes: item.attributes ?? [],
          roastLevelId: item.roastLevelId,
          roastLevelName: item.roastLevelName,
          grindTypeId: item.grindTypeId,
          grindTypeName: item.grindTypeName,
        })),
        currencyCode: basketPayload.currencyCode || undefined,
        isLocked: false,
      }),
    })
  },

  deleteBasketItem: (basketId: string, itemId: string) =>
    apiFetch<void>(`/basket/${basketId}/items/${itemId}`, { method: "DELETE" }),

  clearBasket: (basketId: string) =>
    apiFetch<CustomerBasketDto>(`/basket`, {
      method: "POST",
      body: JSON.stringify({ 
        id: basketId,
        items: [],
        isLocked: false,
      }),
    }),
};
