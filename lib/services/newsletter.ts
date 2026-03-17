import { apiFetch } from "../axios";

// ─── Public ───────────────────────────────────────────────────────────────────

export interface SubscribePayload {
  email: string;
}

export interface SubscribeResponse {
  message?: string;
}

export async function subscribeToNewsletter(
  payload: SubscribePayload
): Promise<SubscribeResponse> {
  return apiFetch<SubscribeResponse>("/newsletter/subscribe", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export interface Subscriber {
  id: string;
  email: string;
  isVerified: boolean;
  source: string | null;
  createdAt: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export async function getAdminSubscribers(params: {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
}): Promise<PagedResult<Subscriber>> {
  const query = new URLSearchParams();
  if (params.pageNumber) query.set("pageNumber", String(params.pageNumber));
  if (params.pageSize) query.set("pageSize", String(params.pageSize));
  if (params.search) query.set("search", params.search);
  return apiFetch<PagedResult<Subscriber>>(
    `/admin/newsletter/subscribers?${query.toString()}`
  );
}

export async function sendBulkEmail(payload: {
  subject: string;
  content: string;
}): Promise<SubscribeResponse> {
  return apiFetch<SubscribeResponse>("/admin/newsletter/send-bulk", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
