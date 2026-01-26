/**
 * Product Types for Admin Panel
 * Based on backend DTO structure
 */

export interface ProductPrice {
  price: number;
}

export interface ProductImage {
  imageUrl: string;
  isMain: boolean;
}

export interface AdminProductResponse {
  id: string;
  name: string;
  categoryName: string;
  stockInKg: number;
  availablePrices: ProductPrice[];
  images: ProductImage[];
  roastLevelIds: string[]; // GUIDs
  grindTypeIds: string[]; // GUIDs
  // Additional fields that may be in the response
  description?: string;
  categoryId?: string;
  originId?: string;
  originName?: string;
  slug?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize?: number;
  totalPages: number;
  hasPreviousPage?: boolean;
  hasNextPage?: boolean;
}

/**
 * Minimum price helper
 */
export function getMinPrice(product: AdminProductResponse): number {
  if (!product.availablePrices || product.availablePrices.length === 0) {
    return 0;
  }
  return Math.min(...product.availablePrices.map((p) => p.price));
}

/**
 * Get main image helper
 */
export function getMainImage(product: AdminProductResponse): ProductImage | undefined {
  return product.images?.find((img) => img.isMain);
}
