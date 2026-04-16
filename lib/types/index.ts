// @/lib/types/index.ts

export interface ProductPricePayload {
  productWeightId: string;
  price: number;
  currencyCode: string;
}

export interface ProductPriceDto {
  productVariantId: string;
  weightLabel: string;
  grams: number;
  price: number;
  currencyCode: string; // 👈 Bu mütləq olmalıdır
}

export interface CurrencyOptionDto {
  currencyCode: string;
  weightLabel: string;
  grams: number;
  price: number;
  productVariantId: string;
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

export interface VariantDto {
  id: string;
  sku: string;
  price: number;
  stockQuantity: number | null;
  options: VariantOptionDto[];
}

export interface ProductImageDto {
  id: string;
  imageUrl: string;
  isMain: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
  categoryId: string;
  categoryName: string;
  brandId?: string | null;
  brandName?: string | null;
  specifications?: Record<string, string> | null;
  translations: ProductTranslationDto[];
  coffeeProfile: ProductCoffeeProfileDto | null;
  variants: VariantDto[];
  createdAt: string;
  updatedAt: string | null;
  images: ProductImageDto[];
}

export interface MasterData {
  attributes: { id: string; name: string; values: { id: string; value: string }[] }[];
  roastLevels: { id: string; name: string }[];
  grindTypes: { id: string; name: string }[];
  categories: { id: string; name: string; slug: string; isCoffeeCategory: boolean }[];
  origins: { id: string; name: string }[];
  brands: { id: string; name: string }[];
}
