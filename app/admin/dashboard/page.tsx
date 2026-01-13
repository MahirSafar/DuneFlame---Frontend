"use client"

import { useAuthStore } from "@/lib/auth-store"
import { getDashboardStats, DashboardStats } from "@/lib/services/admin"
import { TrendingUp, ShoppingCart, Users, Package, Activity, Clock, Loader2, BarChart3, PieChart } from "lucide-react"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { LineChart, Line, PieChart as RechartsPie, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6"]

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
          <h1 className="text-3xl md:text-4xl font-bold text-primary dark:text-primary-foreground">Admin Console</h1>
          <p className="text-muted-foreground">
            Welcome back, <span className="font-semibold text-accent">{firstName}</span>
          </p>
        </div>

        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <Loader2 size={48} className="text-accent animate-spin" />
            <p className="text-muted-foreground">Loading dashboard stats...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="p-4 md:p-8 space-y-6 md:space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-primary dark:text-primary-foreground">Admin Console</h1>
          <p className="text-muted-foreground">
            Welcome back, <span className="font-semibold text-accent">{firstName}</span>
          </p>
        </div>

        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-destructive">{error || "Failed to load dashboard stats"}</p>
        </div>
      </div>
    )
  }

  const formattedRevenue = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(stats.totalRevenue)

  const formattedAOV = stats.averageOrderValue
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(stats.averageOrderValue)
    : "$0.00"

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold text-primary dark:text-primary-foreground">Admin Console</h1>
        <p className="text-muted-foreground">
          Welcome back, <span className="font-semibold text-accent">{firstName}</span>
        </p>
      </div>

      {/* Key Metrics Grid */}
      <div className="bento-grid bento-cols-4">
        <div className="bento-span-lg glass-mocha hover-lift">
          <div className="bento-content">
            <div className="flex items-start justify-between mb-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground font-medium">Total Revenue</p>
                <h3 className="text-4xl md:text-5xl font-bold text-primary dark:text-primary-foreground">{formattedRevenue}</h3>
                <div className="flex items-center gap-2 text-accent">
                  <TrendingUp size={18} className="animate-float-soft" />
                  <span className="text-sm font-semibold">+{stats.revenueGrowthPercentage}% this month</span>
                </div>
              </div>
              <div className="p-4 bg-accent/20 rounded-2xl glow-warm">
                <TrendingUp size={32} className="text-accent" />
              </div>
            </div>
            <div className="mt-auto pt-4 border-t border-border/50">
              <p className="text-xs text-muted-foreground">Last updated: Just now</p>
            </div>
          </div>
        </div>

        <div className="bento-row-1 glass-warm hover-lift">
          <div className="bento-content">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-orange-500/20 rounded-xl">
                <ShoppingCart size={24} className="text-orange-500" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Active Orders</p>
            <h4 className="text-3xl font-bold text-primary dark:text-primary-foreground">{stats.activeOrders}</h4>
            <p className="text-xs text-muted-foreground mt-2">{stats.pendingShipmentOrders} pending shipment</p>
          </div>
        </div>

        <div className="bento-row-1 glass-cream hover-lift">
          <div className="bento-content">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-amber-500/20 rounded-xl">
                <Users size={24} className="text-amber-600" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Total Customers</p>
            <h4 className="text-3xl font-bold text-primary dark:text-primary-foreground">{stats.totalUsers}</h4>
            <p className="text-xs text-muted-foreground mt-2">+{stats.newUsersThisWeek} this week</p>
          </div>
        </div>

        <div className="bento-span-md glass-soft hover-lift">
          <div className="bento-content">
            <div className="flex items-center justify-between h-full">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-green-500/20 rounded-2xl">
                  <Package size={32} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Inventory</p>
                  <h4 className="text-3xl font-bold text-primary dark:text-primary-foreground">{stats.totalProducts}</h4>
                  <p className="text-xs text-muted-foreground mt-1">Products in stock</p>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-red-500/20 text-red-600 dark:text-red-400 rounded-full text-xs font-semibold">
                  {stats.lowStockCount} Low Stock
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Additional KPIs */}
        {stats.averageOrderValue !== undefined && (
          <div className="bento-row-1 glass-warm hover-lift">
            <div className="bento-content">
              <p className="text-sm text-muted-foreground mb-1">Avg Order Value</p>
              <h4 className="text-3xl font-bold text-primary dark:text-primary-foreground">{formattedAOV}</h4>
              <p className="text-xs text-muted-foreground mt-2">Per transaction</p>
            </div>
          </div>
        )}

        {stats.conversionRate !== undefined && (
          <div className="bento-row-1 glass-cream hover-lift">
            <div className="bento-content">
              <p className="text-sm text-muted-foreground mb-1">Conversion Rate</p>
              <h4 className="text-3xl font-bold text-primary dark:text-primary-foreground">{stats.conversionRate}%</h4>
              <p className="text-xs text-muted-foreground mt-2">Customer conversion</p>
            </div>
          </div>
        )}
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
                    borderRadius: "8px"
                  }}
                  labelStyle={{ color: "#ffffff", fontSize: "14px", fontWeight: "bold" }}
                  itemStyle={{ color: "#ffffff", fontSize: "13px" }}
                  formatter={(value) => [value, "Count"]}
                  contentStyleN={{ padding: "8px 12px" }}
                />
                <Legend wrapperStyle={{ paddingTop: "20px" }} />
              </RechartsPie>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Top Products Table */}
      {stats.topProducts && stats.topProducts.length > 0 && (
        <div className="glass hover-lift rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Package size={20} className="text-accent" />
            <h3 className="text-lg font-bold text-primary dark:text-primary-foreground">Top Selling Products</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-3 px-4 text-muted-foreground font-semibold">Product Name</th>
                  <th className="text-right py-3 px-4 text-muted-foreground font-semibold">Units Sold</th>
                  <th className="text-right py-3 px-4 text-muted-foreground font-semibold">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {stats.topProducts.map((product) => (
                  <tr key={product.id} className="border-b border-border/30 hover:bg-white/5 transition-smooth">
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
              stats.recentActivities.map((activity) => (
                <div key={activity.id} className="p-3 bg-white/30 dark:bg-white/5 rounded-lg hover:bg-white/50 dark:hover:bg-white/10 transition-smooth">
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
