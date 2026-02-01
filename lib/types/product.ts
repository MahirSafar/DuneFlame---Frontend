// UpdateProductRequest for edit operations
export interface UpdateProductRequest {
  name: string;
  description: string;
  stockInKg: number;
  categoryId: string;
  originId: string | null;
  roastLevelIds: string[];
  grindTypeIds: string[];
  prices: { productWeightId: string; price: number }[];
  flavourNotes: FlavourNoteDto[];
  images?: File[]; // Newly added images
  deletedImageIds?: string[]; // IDs of images to delete
  setMainImageId?: string; // ID of the image to set as main
}
// Product Response & Base Types
export interface ProductImageDto {
  id: string;
  imageUrl: string;
  isMain: boolean;
}

export interface ProductPriceDto {
  productPriceId: string;
  weightLabel: string;
  grams: number;
  price: number;
  currencyCode: string;
}

export interface FlavourNoteDto {
  id?: string;
  name: string;
  displayOrder: number;
  translations?: { languageCode: string; name: string }[];
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  stockInKg: number;
  isActive: boolean;
  categoryId: string;
  categoryName: string;
  originId: string | null;
  originName: string | null;
  roastLevelIds: string[];
  grindTypeIds: string[];
  flavourNotes: FlavourNoteDto[];
  activePrice: ProductPriceDto | null;
  otherAvailableCurrencies: ProductPriceDto[];
  images: ProductImageDto[];
}

// If you intended to define a paginated response, add an interface like this:
export interface ProductPage {
  items: Product[];
  hasPreviousPage?: boolean;
  hasNextPage?: boolean;
}

/**
 * AdminProductResponse type definition
 */
export interface AdminProductResponse extends Product {
  availablePrices: ProductPriceDto[];
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
 * ProductImage type definition
 */
export type ProductImage = ProductImageDto;

/**
 * Get main image helper
 */
export function getMainImage(product: AdminProductResponse): ProductImage | undefined {
  return product.images?.find((img) => img.isMain);
}
