/**
 * Admin Product Service
 * Handles API calls for admin product management
 */

import axios from "@/lib/axios";
import { PagedResult } from "@/lib/services/products";
import type { AdminProductResponse } from "@/lib/types/product";

interface GetProductsParams {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  categoryId?: string;
  sortBy?: string;
}

/**
 * Get paginated list of products for admin panel
 */
export async function getAdminProducts(
  params: GetProductsParams = {}
): Promise<PagedResult<AdminProductResponse>> {
  const query = new URLSearchParams();

  if (params.pageNumber) query.set("pageNumber", String(params.pageNumber));
  if (params.pageSize) query.set("pageSize", String(params.pageSize));
  if (params.search) query.set("search", params.search);
  if (params.categoryId) query.set("categoryId", params.categoryId);
  if (params.sortBy) query.set("sortBy", params.sortBy);

  const qs = query.toString();
  const { data } = await axios.get<PagedResult<AdminProductResponse>>(
    `/admin/products${qs ? `?${qs}` : ""}`
  );

  return data;
}

/**
 * Get a single product by ID for editing
 */
export async function getAdminProductById(
  id: string
): Promise<AdminProductResponse> {
  const { data } = await axios.get<AdminProductResponse>(`/admin/products/${id}`);
  return data;
}

/**
 * Delete a product by ID
 */
export async function deleteAdminProduct(id: string): Promise<void> {
  await axios.delete(`/admin/products/${id}`);
}

/**
 * Update a product
 */
export async function updateAdminProduct(
  id: string,
  formData: FormData
): Promise<AdminProductResponse> {
  const { data } = await axios.put<AdminProductResponse>(
    `/admin/products/${id}`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return data;
}

/**
 * Create a new product
 */
export async function createAdminProduct(
  formData: FormData
): Promise<AdminProductResponse> {
  const { data } = await axios.post<AdminProductResponse>(
    "/admin/products",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return data;
}
