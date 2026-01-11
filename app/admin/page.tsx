"use client"

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { TrendingUp, ShoppingCart, Users, Gift, DollarSign, Package } from "lucide-react"

const revenueData = [
  { month: "Jan", revenue: 12000 },
  { month: "Feb", revenue: 19000 },
  { month: "Mar", revenue: 15000 },
  { month: "Apr", revenue: 22000 },
  { month: "May", revenue: 28000 },
  { month: "Jun", revenue: 35000 },
]

const orderData = [
  { month: "Jan", orders: 120 },
  { month: "Feb", orders: 190 },
  { month: "Mar", orders: 150 },
  { month: "Apr", orders: 220 },
  { month: "May", orders: 280 },
  { month: "Jun", orders: 350 },
]

const categoryData = [
  { name: "Beans", value: 35 },
  { name: "Capsules", value: 25 },
  { name: "Equipment", value: 25 },
  { name: "Accessories", value: 15 },
]

const colors = ["#ff6b00", "#c68e4a", "#5a3825", "#2b1b12"]

export default function AdminDashboard() {
  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-primary dark:text-secondary mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back to DuneFlame Admin</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Revenue */}
        <div className="glass rounded-xl p-6 card-depth card-float">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
              <h3 className="text-3xl font-bold text-primary dark:text-secondary">$131,000</h3>
            </div>
            <div className="p-3 bg-accent/20 rounded-lg">
              <DollarSign size={24} className="text-accent" />
            </div>
          </div>
          <p className="text-sm text-accent flex items-center gap-1">
            <TrendingUp size={16} /> 12% increase this month
          </p>
        </div>

        {/* Total Orders */}
        <div className="glass rounded-xl p-6 card-depth card-float">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Orders</p>
              <h3 className="text-3xl font-bold text-primary dark:text-secondary">1,250</h3>
            </div>
            <div className="p-3 bg-orange-500/20 rounded-lg">
              <ShoppingCart size={24} className="text-orange-500" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">350 this month</p>
        </div>

        {/* Total Users */}
        <div className="glass rounded-xl p-6 card-depth card-float">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Active Users</p>
              <h3 className="text-3xl font-bold text-primary dark:text-secondary">2,847</h3>
            </div>
            <div className="p-3 bg-amber-500/20 rounded-lg">
              <Users size={24} className="text-amber-500" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">142 new this week</p>
        </div>

        {/* Total Products */}
        <div className="glass rounded-xl p-6 card-depth card-float">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Products</p>
              <h3 className="text-3xl font-bold text-primary dark:text-secondary">248</h3>
            </div>
            <div className="p-3 bg-green-500/20 rounded-lg">
              <Package size={24} className="text-green-500" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">15 low stock</p>
        </div>

        {/* Rewards Points Distributed */}
        <div className="glass rounded-xl p-6 card-depth card-float">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Rewards Distributed</p>
              <h3 className="text-3xl font-bold text-primary dark:text-secondary">45K pts</h3>
            </div>
            <div className="p-3 bg-pink-500/20 rounded-lg">
              <Gift size={24} className="text-pink-500" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">8K redeemed this month</p>
        </div>

        {/* Average Order Value */}
        <div className="glass rounded-xl p-6 card-depth card-float">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Avg Order Value</p>
              <h3 className="text-3xl font-bold text-primary dark:text-secondary">$104.80</h3>
            </div>
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <TrendingUp size={24} className="text-purple-500" />
            </div>
          </div>
          <p className="text-sm text-accent flex items-center gap-1">
            <TrendingUp size={16} /> 5.2% from last month
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 glass rounded-xl p-6 card-depth">
          <h3 className="text-lg font-bold text-primary dark:text-secondary mb-6">Monthly Revenue</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,107,0,0.1)" />
              <XAxis stroke="rgba(200,200,200,0.5)" />
              <YAxis stroke="rgba(200,200,200,0.5)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(43,27,18,0.9)",
                  border: "1px solid rgba(255,107,0,0.3)",
                  borderRadius: "8px",
                }}
              />
              <Line type="monotone" dataKey="revenue" stroke="#ff6b00" strokeWidth={2} dot={{ fill: "#c68e4a" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution */}
        <div className="glass rounded-xl p-6 card-depth">
          <h3 className="text-lg font-bold text-primary dark:text-secondary mb-6">Products by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" labelLine={false} label="name" dataKey="value">
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: "rgba(43,27,18,0.9)", border: "1px solid rgba(255,107,0,0.3)" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Orders Chart */}
        <div className="lg:col-span-3 glass rounded-xl p-6 card-depth">
          <h3 className="text-lg font-bold text-primary dark:text-secondary mb-6">Order Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={orderData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,107,0,0.1)" />
              <XAxis stroke="rgba(200,200,200,0.5)" />
              <YAxis stroke="rgba(200,200,200,0.5)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(43,27,18,0.9)",
                  border: "1px solid rgba(255,107,0,0.3)",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="orders" fill="#ff6b00" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="glass rounded-xl p-6 card-depth">
        <h3 className="text-lg font-bold text-primary dark:text-secondary mb-6">Recent Orders</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Order ID</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Customer</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Amount</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody>
              {[
                { id: "ORD-001", customer: "John Doe", amount: "$145.00", status: "Delivered", date: "Jun 15, 2024" },
                { id: "ORD-002", customer: "Jane Smith", amount: "$89.50", status: "Shipped", date: "Jun 14, 2024" },
                {
                  id: "ORD-003",
                  customer: "Mike Johnson",
                  amount: "$210.00",
                  status: "Processing",
                  date: "Jun 13, 2024",
                },
                {
                  id: "ORD-004",
                  customer: "Sarah Williams",
                  amount: "$75.25",
                  status: "Pending",
                  date: "Jun 12, 2024",
                },
              ].map((order) => (
                <tr key={order.id} className="border-b border-border hover:bg-accent/5 transition-smooth">
                  <td className="py-3 px-4 text-sm font-medium text-foreground">{order.id}</td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">{order.customer}</td>
                  <td className="py-3 px-4 text-sm font-semibold text-primary dark:text-secondary">{order.amount}</td>
                  <td className="py-3 px-4 text-sm">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        order.status === "Delivered"
                          ? "bg-green-500/20 text-green-700 dark:text-green-400"
                          : order.status === "Shipped"
                            ? "bg-blue-500/20 text-blue-700 dark:text-blue-400"
                            : "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">{order.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
