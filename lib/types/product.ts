// Product Response & Base Types
export interface ProductImageDto {
  id: string;
  imageUrl: string;
  isMain: boolean;
}

export interface ProductTranslationDto {
  languageCode: string;
  name: string;
  description: string;
}

export interface FlavourNoteDto {
  id?: string;
  name: string;
  displayOrder: number;
  translations?: { languageCode: string; name: string }[];
}

export interface ProductCoffeeProfileDto {
  originId: string | null;
  originName: string | null;
  roastLevelNames: string[];
  grindTypeNames: string[];
  roastLevelIds: string[];
  grindTypeIds: string[];
  flavourNotes: FlavourNoteDto[];
}

export interface VariantOptionDto {
  attributeName: string;
  value: string;
}

export interface VariantPriceDto {
  currencyCode: string;
  price: number;
}

export interface VariantDto {
  id: string;
  sku: string;
  price: number;
  prices: VariantPriceDto[];
  stockQuantity: number | null;
  options: VariantOptionDto[];
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
  categoryId: string;
  categoryName: string;
  brandId: string | null;
  brandName: string | null;
  specifications: Record<string, string> | null;
  translations: ProductTranslationDto[];
  coffeeProfile: ProductCoffeeProfileDto | null;
  variants: VariantDto[];
  createdAt: string;
  updatedAt: string | null;
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
export type AdminProductResponse = Product;

/**
 * Minimum price helper
 */
export function getMinPrice(product: AdminProductResponse): number {
  if (!product.variants || product.variants.length === 0) {
    return 0;
  }
  return Math.min(...product.variants.map((v) => v.price));
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
