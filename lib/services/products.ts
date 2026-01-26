import axios from "@/lib/axios";
import { apiFetch } from "../api-client";
import type { MasterData, CreateProductPayload } from "@/lib/types";

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

export interface ProductPriceDto {
  productPriceId: string;
  weightLabel: string;
  grams: number;
  price: number;
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
}

export type Product = Omit<ProductResponse, "slug"> & { slug?: string };

type ProductQuery = {
  pageNumber?: number;
  pageSize?: number;
  page?: number; // legacy support
  size?: number; // legacy support
  sort?: string;
  search?: string;
  categoryId?: string;
  originId?: string;
  minPrice?: number;
  maxPrice?: number;
  roastLevel?: number;
  sortBy?: string;
};

export async function getProducts(params: ProductQuery = {}) {
  const query = new URLSearchParams();

  const pageNumber = params.pageNumber ?? params.page;
  const pageSize = params.pageSize ?? params.size;

  if (pageNumber) query.set("pageNumber", String(pageNumber));
  if (pageSize) query.set("pageSize", String(pageSize));
  if (params.sort) query.set("sort", params.sort);
  if (params.search) query.set("search", params.search);
  if (params.categoryId) query.set("categoryId", params.categoryId);
  
  const qs = query.toString();
  const response = await apiFetch<PagedResult<ProductResponse>>(`/products${qs ? `?${qs}` : ""}`);
  return response;
}

export async function getAdminProducts(params: ProductQuery = {}) {
  const query = new URLSearchParams();

  const pageNumber = params.pageNumber ?? params.page;
  const pageSize = params.pageSize ?? params.size;

  if (pageNumber) query.set("pageNumber", String(pageNumber));
  if (pageSize) query.set("pageSize", String(pageSize));
  if (params.sort) query.set("sort", params.sort);
  if (params.search) query.set("search", params.search);
  if (params.categoryId) query.set("categoryId", params.categoryId);
  
  const qs = query.toString();
  return apiFetch<PagedResult<ProductResponse>>(`/admin/products${qs ? `?${qs}` : ""}`);
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

export async function getCategories() {
  return apiFetch<Category[]>("/categories");
}

export async function getOrigins() {
  // Backend PagedResult qaytarır, bizə onun içindəki 'items' massivi lazımdır.
  // Dropdown olduğu üçün pageSize=100 qoyuruq ki, hamısını gətirsin.
  const response = await apiFetch<PagedResult<Origin>>("/admin/origins?pageSize=100");
  return response.items;
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

/**
 * Fetch all master data for Silo Inventory v2
 * Returns weights, roast levels, grind types, categories, and origins
 */
export async function getMasterData(): Promise<MasterData> {
  return apiFetch<MasterData>("/master-data/all");
}

/**
 * Create a new product using Silo Inventory v2
 * Accepts FormData with product details
 */
export async function createProductV2(data: FormData) {
  const response = await axios.post<Product>("/admin/products", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}
