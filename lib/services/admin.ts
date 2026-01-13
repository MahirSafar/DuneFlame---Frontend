import axios from "@/lib/axios";

export interface RecentActivity {
  id: string;
  type: string;
  message: string;
  time: string;
}

export interface RevenueChartData {
  date: string;
  revenue: number;
  orders: number;
}

export interface OrderStatusData {
  status: string;
  count: number;
  color: string;
}

export interface TopProduct {
  id: string;
  name: string;
  sales: number;
  revenue: number;
}

export interface DashboardStats {
  totalRevenue: number;
  revenueGrowthPercentage: number;
  activeOrders: number;
  pendingShipmentOrders: number;
  totalUsers: number;
  newUsersThisWeek: number;
  totalProducts: number;
  lowStockCount: number;
  recentActivities: RecentActivity[];
  revenueChart?: RevenueChartData[];
  orderStatus?: OrderStatusData[];
  topProducts?: TopProduct[];
  conversionRate?: number;
  averageOrderValue?: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data } = await axios.get<DashboardStats>("/admin/dashboard/stats");
  return data;
}
