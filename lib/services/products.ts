import axios from "@/lib/axios";
import { apiFetch } from "../api-client";
import type { MasterData, Product, ProductPriceDto } from "@/lib/types";
import type { FlavourNoteDto } from "@/lib/types/flavour-note";

export type { Product };

// Backend-dən gələn siyahı cavabı (Products üçün)
export interface PagedResult<T> {
  items: T[]; 
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface Category {
  id: string;
  name: string;
}

// Master Data üçün sadə Origin (Pagination yoxdur)
export interface Origin {
  id: string;
  name: string;
  region?: string;
  country?: string;
}

export interface ProductImageDto {
  id: string;
  imageUrl: string;
  isMain: boolean;
}

export interface ProductResponse {
  id: string;
  slug: string;
  name: string;
  description: string;
  stockInKg: number;
  isActive: boolean;
  categoryId: string;
  categoryName: string;
  originName?: string;
  originId?: string;
  availablePrices: ProductPriceDto[];
  roastLevelNames: string[];
  roastLevelIds: string[];
  grindTypeNames: string[];
  grindTypeIds: string[];
  createdAt: string;
  updatedAt?: string;
  images: ProductImageDto[];
  flavourNotes?: FlavourNoteDto[];
}

export interface RoastLevel {
  id: string;
  name: string;
}

export interface MasterDataResponse {
  roastLevels: RoastLevel[];
  origins: Origin[];
}

export type ProductQuery = {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  roastLevelIds?: string[]; // Array
  originIds?: string[];     // Array
  sortBy?: string;
  
  // Legacy support (əgər hələ də lazımdırsa)
  page?: number; 
  size?: number;
  sort?: string;
};

// ============================================================================
// PUBLIC SHOP METHODS (Müştəri üçün)
// ============================================================================

export async function getProducts(params: ProductQuery = {}): Promise<PagedResult<ProductResponse>> {
  const query = new URLSearchParams();

  const pageNumber = params.pageNumber ?? params.page ?? 1;
  const pageSize = params.pageSize ?? params.size ?? 12;

  // 1. Sadə parametrləri set edirik
  query.set("pageNumber", String(pageNumber));
  query.set("pageSize", String(pageSize));

  if (params.search) query.set("search", params.search);
  if (params.categoryId) query.set("categoryId", params.categoryId);
  if (params.minPrice !== undefined) query.set("minPrice", String(params.minPrice));
  if (params.maxPrice !== undefined) query.set("maxPrice", String(params.maxPrice));
  if (params.sortBy) query.set("sortBy", params.sortBy);

  // 2. Array parametrlərini APPEND edirik (Backend Contract Tələbi)
  // Bu yaradır: ?roastLevelIds=ID1&roastLevelIds=ID2
  if (params.roastLevelIds && params.roastLevelIds.length > 0) {
    params.roastLevelIds.forEach((id) => {
      query.append("roastLevelIds", id);
    });
  }

  if (params.originIds && params.originIds.length > 0) {
    params.originIds.forEach((id) => {
      query.append("originIds", id);
    });
  }

  const qs = query.toString();
  
  // 🔍 DEBUG: Log the final URL being sent
  const finalUrl = `/products${qs ? `?${qs}` : ""}`;
  console.log("[getProducts] Final URL:", finalUrl);
  console.log("[getProducts] Query params:", {
    roastLevelIds: params.roastLevelIds,
    originIds: params.originIds,
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
    sortBy: params.sortBy,
  });

  const response = await apiFetch<PagedResult<ProductResponse>>(finalUrl);
  return response;
}

export function getProduct(idOrSlug: string, options?: { admin?: false }): Promise<ProductResponse>;
export function getProduct(idOrSlug: string, options: { admin: true }): Promise<Product>;
export async function getProduct(idOrSlug: string, options?: { admin?: boolean }) {
  if (options?.admin) {
    const { data } = await axios.get<Product>(`/admin/products/${idOrSlug}`);
    return data;
  }

  return apiFetch<ProductResponse>(`/products/${idOrSlug}`);
}

// ============================================================================
// MASTER DATA METHODS (Dropdownlar üçün)
// ============================================================================

export async function getCategories() {
  // Public master-data endpointi
  return apiFetch<Category[]>("/master-data/categories");
}

export async function getOrigins() {
  // DÜZƏLİŞ: /admin/origins PagedResult qaytarırdı.
  // Backend Contract deyir ki, /master-data/origins sadə Array qaytarır.
  return apiFetch<Origin[]>("/master-data/origins");
}

export async function getRoastLevels(): Promise<RoastLevel[]> {
  // Public master-data endpointi
  return apiFetch<RoastLevel[]>("/master-data/roast-levels");
}

export async function getMasterData(): Promise<MasterData> {
  return apiFetch<MasterData>("/master-data/all");
}

// ============================================================================
// ADMIN METHODS (Yalnız Admin Panel üçün)
// ============================================================================

export async function getAdminProducts(params: ProductQuery = {}): Promise<{ items: Product[], totalCount: number, totalPages: number, hasNextPage: boolean, hasPreviousPage: boolean }> {
  const query = new URLSearchParams();

  const pageNumber = params.pageNumber ?? params.page;
  const pageSize = params.pageSize ?? params.size;

  if (pageNumber) query.set("pageNumber", String(pageNumber));
  if (pageSize) query.set("pageSize", String(pageSize));
  if (params.sort) query.set("sort", params.sort);
  if (params.search) query.set("search", params.search);
  if (params.categoryId) query.set("categoryId", params.categoryId);
  
  const qs = query.toString();
  const response = await apiFetch<PagedResult<ProductResponse>>(`/admin/products${qs ? `?${qs}` : ""}`);
  
  const items: Product[] = response.items.map((item) => ({
    ...item,
    activePrice: null,
    otherAvailableCurrencies: [],
    availablePrices: item.availablePrices,
    images: item.images,
    roastLevelNames: item.roastLevelNames,
    grindTypeNames: item.grindTypeNames,
    roastLevelIds: item.roastLevelIds,
    grindTypeIds: item.grindTypeIds,
  }));
  
  return {
    items,
    totalCount: response.totalCount,
    totalPages: response.totalPages,
    hasNextPage: response.hasNextPage,
    hasPreviousPage: response.hasPreviousPage,
  };
}

export async function createProduct(data: FormData) {
  const response = await axios.post<Product>("/admin/products", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

export async function updateProduct(id: string, data: FormData) {
  const response = await axios.put<Product>(`/admin/products/${id}`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

export async function deleteProduct(id: string) {
  await axios.delete(`/admin/products/${id}`);
}

export async function restoreProduct(id: string) {
  const response = await axios.patch<Product>(`/admin/products/${id}/restore`);
  return response.data;
}

export async function createProductV2(data: FormData) {
  const response = await axios.post<Product>("/admin/products", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}