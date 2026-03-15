import { apiFetch } from "../api-client";

// ─── Public form submission ───────────────────────────────────────────────────

export interface SubmitContactFormPayload {
  Name: string;
  Email: string;
  Subject: string;
  Message: string;
}

export interface SubmitContactFormResponse {
  message?: string;
}

export async function submitContactForm(
  payload: SubmitContactFormPayload
): Promise<SubmitContactFormResponse> {
  return apiFetch<SubmitContactFormResponse>("/contact", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ─── Admin contact management ─────────────────────────────────────────────────

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string; // ISO date string
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

export interface AdminContactsQuery {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
}

export async function getAdminContacts(
  params: AdminContactsQuery = {}
): Promise<PagedResult<ContactMessage>> {
  const query = new URLSearchParams();
  if (params.pageNumber) query.set("pageNumber", String(params.pageNumber));
  if (params.pageSize)   query.set("pageSize",   String(params.pageSize));
  if (params.search)     query.set("search",     params.search);
  const qs = query.toString();
  return apiFetch<PagedResult<ContactMessage>>(
    `/admin/contacts${qs ? `?${qs}` : ""}`
  );
}

export async function markContactAsRead(id: string): Promise<void> {
  return apiFetch<void>(`/admin/contacts/${id}/read`, { method: "PATCH" });
}

export async function deleteContact(id: string): Promise<void> {
  return apiFetch<void>(`/admin/contacts/${id}`, { method: "DELETE" });
}
