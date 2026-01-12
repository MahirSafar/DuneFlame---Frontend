"use client"

import { useAuthStore } from "@/lib/auth-store"
import { TrendingUp, ShoppingCart, Users, Package, Activity, Clock } from "lucide-react"

const recentActivities = [
  { id: 1, type: "order", message: "New Order #5231 received", time: "2 mins ago" },
  { id: 2, type: "user", message: "New user registration", time: "15 mins ago" },
  { id: 3, type: "product", message: "Product stock updated", time: "1 hour ago" },
  { id: 4, type: "order", message: "Order #5228 shipped", time: "2 hours ago" },
  { id: 5, type: "user", message: "3 new user registrations", time: "3 hours ago" },
  { id: 6, type: "product", message: "New product added", time: "5 hours ago" },
]

export default function AdminDashboard() {
  const { user } = useAuthStore()
  const firstName = user?.firstName ?? "Admin"

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold text-primary dark:text-primary-foreground">Admin Console</h1>
        <p className="text-muted-foreground">
          Welcome back, <span className="font-semibold text-accent">{firstName}</span>
        </p>
      </div>

      <div className="bento-grid bento-cols-4">
        <div className="bento-span-lg glass-mocha hover-lift">
          <div className="bento-content">
            <div className="flex items-start justify-between mb-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground font-medium">Total Revenue</p>
                <h3 className="text-4xl md:text-5xl font-bold text-primary dark:text-primary-foreground">$131,000</h3>
                <div className="flex items-center gap-2 text-accent">
                  <TrendingUp size={18} className="animate-float-soft" />
                  <span className="text-sm font-semibold">+12% this month</span>
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
            <h4 className="text-3xl font-bold text-primary dark:text-primary-foreground">248</h4>
            <p className="text-xs text-muted-foreground mt-2">68 pending shipment</p>
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
            <h4 className="text-3xl font-bold text-primary dark:text-primary-foreground">2,847</h4>
            <p className="text-xs text-muted-foreground mt-2">+142 this week</p>
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
                  <h4 className="text-3xl font-bold text-primary dark:text-primary-foreground">1,284</h4>
                  <p className="text-xs text-muted-foreground mt-1">Products in stock</p>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-red-500/20 text-red-600 dark:text-red-400 rounded-full text-xs font-semibold">
                  15 Low Stock
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bento-row-2 glass hover-lift">
          <div className="bento-content">
            <div className="flex items-center gap-2 mb-4">
              <Activity size={20} className="text-accent" />
              <h4 className="text-lg font-bold text-primary dark:text-primary-foreground">Recent Activities</h4>
            </div>
            <div className="space-y-3 overflow-y-auto flex-1">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="p-3 bg-white/30 dark:bg-white/5 rounded-lg hover:bg-white/50 dark:hover:bg-white/10 transition-smooth"
                >
                  <p className="text-sm text-foreground font-medium mb-1">{activity.message}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock size={12} />
                    <span>{activity.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
