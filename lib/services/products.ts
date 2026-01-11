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

export interface ProductResponse {
  id: string;
  name: string;
  description: string;
  price: number;
  oldPrice?: number;
  stockQuantity: number;
  isActive: boolean;
  categoryId: string;
  categoryName: string;
  createdAt: string;
  updatedAt?: string;
  images: { id: string; imageUrl: string; isMain: boolean }[];
}

export async function getProducts(params: {
  page?: number;
  size?: number;
  sort?: string;
  search?: string;
  categoryId?: string;
} = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.size) query.set("size", String(params.size));
  if (params.sort) query.set("sort", params.sort);
  if (params.search) query.set("search", params.search);
  if (params.categoryId) query.set("categoryId", params.categoryId);
  const qs = query.toString();
  return apiFetch<PagedResult<ProductResponse>>(`/products${qs ? `?${qs}` : ""}`);
}

export async function getProduct(id: string) {
  return apiFetch<ProductResponse>(`/products/${id}`);
}
