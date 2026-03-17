import { apiFetch } from "../axios";

export enum OrderStatus {
  Pending = 0,
  Paid = 1,
  Shipped = 2,
  Delivered = 3,
  Cancelled = 4,
}

export const OrderStatusLabels: Record<OrderStatus, string> = {
  [OrderStatus.Pending]: "Pending",
  [OrderStatus.Paid]: "Paid",
  [OrderStatus.Shipped]: "Shipped",
  [OrderStatus.Delivered]: "Delivered",
  [OrderStatus.Cancelled]: "Cancelled",
};

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
}

export interface Order {
  id: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt: string; // ISO Date
  items: OrderItem[];
  shippingAddress: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  paymentTransactionId?: string;
}

export type OrderQuery = {
  pageNumber?: number;
  pageSize?: number;
  status?: string;
  search?: string;
};

export async function getOrders(params: OrderQuery = {}): Promise<PagedResult<Order>> {
  const query = new URLSearchParams();

  if (params.pageNumber) query.set("pageNumber", String(params.pageNumber));
  if (params.pageSize) query.set("pageSize", String(params.pageSize));
  if (params.status) query.set("status", params.status);
  if (params.search) query.set("search", params.search);

  const qs = query.toString();
  return apiFetch<PagedResult<Order>>(
    `/admin/orders${qs ? `?${qs}` : ""}`
  );
}

export async function updateOrderStatus(
  id: string,
  status: number
): Promise<Order> {
  return apiFetch<Order>(`/admin/orders/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}

export async function cancelOrder(id: string): Promise<Order> {
  return apiFetch<Order>(`/admin/orders/${id}/cancel`, {
    method: "POST",
  });
}

export async function getMyOrders(): Promise<Order[]> {
  return apiFetch<Order[]>("/orders");
}

export async function getOrderById(id: string): Promise<Order> {
  return apiFetch<Order>(`/orders/${id}`);
}
