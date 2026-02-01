// @/lib/types/index.ts

export interface ProductPricePayload {
  productWeightId: string;
  price: number;
  currencyCode: string;
}

export interface ProductPriceDto {
  productPriceId: string;
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
  productPriceId: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  stockInKg: number;
  isActive: boolean;
  categoryName?: string;
  originName?: string;
  categoryId: string;
  originId?: string;
  
  // Backend Multi-Currency
  activePrice: ProductPriceDto | null;
  otherAvailableCurrencies: CurrencyOptionDto[];
  availablePrices?: ProductPriceDto[]; // fallback
  
  images?: { id: string; imageUrl: string; isMain: boolean }[];
  roastLevelNames?: string[];
  grindTypeNames?: string[];
  roastLevelIds?: string[];
  grindTypeIds?: string[];
}

export interface MasterData {
  weights: { id: string; label: string; grams: number }[];
  roastLevels: { id: string; name: string }[];
  grindTypes: { id: string; name: string }[];
  categories: { id: string; name: string; slug: string }[];
  origins: { id: string; name: string }[];
}
