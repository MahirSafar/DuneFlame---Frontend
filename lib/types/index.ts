/**
 * Master Data Types for Silo Inventory v2
 */

export interface Weight {
  id: string;
  label: string;
  grams: number;
}

export interface RoastLevel {
  id: string;
  name: string;
}

export interface GrindType {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Origin {
  id: string;
  name: string;
}

export interface MasterData {
  weights: Weight[];
  roastLevels: RoastLevel[];
  grindTypes: GrindType[];
  categories: Category[];
  origins: Origin[];
}

/**
 * Product Creation Payload Types
 */

export interface ProductPricePayload {
  productWeightId: string;
  price: number;
}

export interface CreateProductPayload {
  name: string;
  description: string;
  stockInKg: number;
  categoryId: string;
  originId?: string;
  roastLevelIds: string[];
  grindTypeIds: string[];
  prices: ProductPricePayload[];
  images: File[];
}
