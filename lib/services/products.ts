import axios from "@/lib/axios";
import { apiFetch } from "../api-client";

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

export interface ProductResponse {
  id: string;
  name: string;
  description: string;
  price: number;
  discountPercentage: number;
  stockQuantity: number;
  categoryName: string;
  categoryId: string;
  originName?: string;
  originId?: string;
  roastLevel: number;
  flavorNotes: string;
  weight: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  images: ProductImageDto[];
}

export interface Product extends ProductResponse {}

type ProductQuery = {
  pageNumber?: number;
  pageSize?: number;
  page?: number; // legacy support
  size?: number; // legacy support
  sort?: string;
  search?: string;
  categoryId?: string;
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
  return apiFetch<PagedResult<ProductResponse>>(`/products${qs ? `?${qs}` : ""}`);
}

export async function getProduct(id: string, options?: { admin?: boolean }) {
  if (options?.admin) {
    const { data } = await axios.get<Product>(`/admin/products/${id}`);
    return data;
  }

  return apiFetch<ProductResponse>(`/products/${id}`);
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
