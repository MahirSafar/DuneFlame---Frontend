"use client"

import { useAuthStore } from "@/lib/auth-store"
import { getDashboardStats, DashboardStats } from "@/lib/services/admin"
import { TrendingUp, ShoppingCart, Package, AlertTriangle, Activity, Clock, Loader2, BarChart3, PieChart, DollarSign } from "lucide-react"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { LineChart, Line, PieChart as RechartsPie, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"

const COLORS = ["#1F6F78", "#CC3323", "#E2A56E", "#A3291C", "#C3AD98"]

export default function AdminDashboard() {
  const { user } = useAuthStore()
  const firstName = user?.firstName ?? "Admin"
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getDashboardStats()
        setStats(data)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load dashboard stats"
        setError(message)
        toast.error(message)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="p-4 md:p-8 space-y-6 md:space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your store's performance</p>
        </div>

        {/* Skeleton loaders for stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-lg border p-6 space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-40" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="p-4 md:p-8 space-y-6 md:space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your store's performance</p>
        </div>

        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-destructive">{error || "Failed to load dashboard stats"}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your store's performance</p>
      </div>

      {/* Key Metrics Grid - 4 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue - Oasis Teal */}
        <div className="rounded-lg border border-oasis-teal/20 dark:border-oasis-teal/30 bg-oasis-teal/5 dark:bg-oasis-teal/10 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <p className="text-sm text-muted-foreground font-medium">Total Revenue</p>
              <h3 className="text-2xl md:text-3xl font-bold text-oasis-teal dark:text-oasis-teal">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                }).format(stats.totalRevenue)}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                +{stats.revenueGrowthPercentage}% this month
              </p>
            </div>
            <div className="p-3 bg-oasis-teal/20 dark:bg-oasis-teal/30 rounded-lg">
              <DollarSign className="w-6 h-6 text-oasis-teal dark:text-oasis-teal" />
            </div>
          </div>
        </div>

        {/* Active Orders - Flame Caramel */}
        <div className="rounded-lg border border-flame-caramel/20 dark:border-flame-caramel/30 bg-flame-caramel/5 dark:bg-flame-caramel/10 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <p className="text-sm text-muted-foreground font-medium">Active Orders</p>
              <h3 className="text-2xl md:text-3xl font-bold text-flame-caramel dark:text-flame-caramel">
                {stats.activeOrders}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.pendingShipmentOrders} pending shipment
              </p>
            </div>
            <div className="p-3 bg-flame-caramel/20 dark:bg-flame-caramel/30 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-flame-caramel dark:text-flame-caramel" />
            </div>
          </div>
        </div>

        {/* Products in Stock - Flame Apricot */}
        <div className="rounded-lg border border-flame-apricot/20 dark:border-flame-apricot/30 bg-flame-apricot/5 dark:bg-flame-apricot/10 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <p className="text-sm text-muted-foreground font-medium">Coffee in Stock</p>
              <h3 className="text-2xl md:text-3xl font-bold text-flame-apricot dark:text-flame-apricot">
                {stats.totalProducts}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Total inventory
              </p>
            </div>
            <div className="p-3 bg-flame-apricot/20 dark:bg-flame-apricot/30 rounded-lg">
              <Package className="w-6 h-6 text-flame-apricot dark:text-flame-apricot" />
            </div>
          </div>
        </div>

        {/* Low Stock Alerts - Flame Red */}
        <div className={`rounded-lg border p-6 hover:shadow-lg transition-shadow ${
          stats.lowStockCount > 0
            ? "border-flame-red/20 dark:border-flame-red/30 bg-flame-red/5 dark:bg-flame-red/10"
            : "border-dune-taupe/20 dark:border-dune-taupe/30 bg-dune-taupe/5 dark:bg-dune-taupe/10"
        }`}>
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <p className="text-sm text-muted-foreground font-medium">Low Stock Alerts</p>
              <h3 className={`text-2xl md:text-3xl font-bold ${
                stats.lowStockCount > 0
                  ? "text-flame-red dark:text-flame-red"
                  : "text-dune-taupe dark:text-dune-taupe"
              }`}>
                {stats.lowStockCount}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.lowStockCount > 0 ? "⚠️ Action needed!" : "All items healthy"}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${
              stats.lowStockCount > 0
                ? "bg-flame-red/20 dark:bg-flame-red/30"
                : "bg-dune-taupe/20 dark:bg-dune-taupe/30"
            }`}>
              <AlertTriangle className={`w-6 h-6 ${
                stats.lowStockCount > 0
                  ? "text-flame-red dark:text-flame-red"
                  : "text-dune-taupe dark:text-dune-taupe"
              }`} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        {stats.revenueChart && stats.revenueChart.length > 0 && (
          <div className="glass hover-lift rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 size={20} className="text-accent" />
              <h3 className="text-lg font-bold text-primary dark:text-primary-foreground">Revenue & Orders Trend</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.revenueChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-20" />
                <XAxis dataKey="date" stroke="currentColor" className="text-xs opacity-70" />
                <YAxis stroke="currentColor" className="text-xs opacity-70" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="orders" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

{/* Order Status Pie Chart */}
        {stats.orderStatus && stats.orderStatus.length > 0 && (
          <div className="glass hover-lift rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <PieChart size={20} className="text-accent" />
              <h3 className="text-lg font-bold text-primary dark:text-primary-foreground">Order Status Distribution</h3>
            </div>
            <ResponsiveContainer width="100%" height={380}>
              <RechartsPie>
                <Pie
                  data={stats.orderStatus}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                >
                  {stats.orderStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "rgba(0, 0, 0, 0.95)",
                    border: "2px solid rgba(255, 255, 255, 0.5)",
                    borderRadius: "8px",
                    padding: "8px 12px"
                  }}
                  labelStyle={{ color: "#ffffff", fontSize: "14px", fontWeight: "bold" }}
                  itemStyle={{ color: "#ffffff", fontSize: "13px" }}
                  formatter={(value) => [value, "Count"]}
                />
                <Legend wrapperStyle={{ paddingTop: "20px" }} />
              </RechartsPie>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Top Coffee Table */}
      {stats.topProducts && stats.topProducts.length > 0 && (
        <div className="glass hover-lift rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Package size={20} className="text-accent" />
            <h3 className="text-lg font-bold text-primary dark:text-primary-foreground">Top Selling Coffee</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-3 px-4 text-muted-foreground font-semibold">Coffee Name</th>
                  <th className="text-right py-3 px-4 text-muted-foreground font-semibold">Units Sold</th>
                  <th className="text-right py-3 px-4 text-muted-foreground font-semibold">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {stats.topProducts.map((product, productIndex) => (
                  <tr key={`product-${productIndex}-${product.id}`} className="border-b border-border/30 hover:bg-white/5 transition-smooth">
                    <td className="py-3 px-4 text-foreground font-medium">{product.name}</td>
                    <td className="text-right py-3 px-4 text-muted-foreground">{product.sales}</td>
                    <td className="text-right py-3 px-4 text-primary font-semibold">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                      }).format(product.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Activities */}
      <div className="bento-span-full glass hover-lift">
        <div className="bento-content">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={20} className="text-accent" />
            <h4 className="text-lg font-bold text-primary dark:text-primary-foreground">Recent Activities</h4>
          </div>
          <div className="space-y-3 overflow-y-auto flex-1">
            {stats.recentActivities.length > 0 ? (
              stats.recentActivities.map((activity, activityIndex) => (
                <div key={`activity-${activityIndex}-${activity.id}`} className="p-3 bg-white/30 dark:bg-white/5 rounded-lg hover:bg-white/50 dark:hover:bg-white/10 transition-smooth">
                  <p className="text-sm text-foreground font-medium mb-1">{activity.message}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock size={12} />
                    <span>{new Date(activity.time).toLocaleString()}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No recent activities</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
