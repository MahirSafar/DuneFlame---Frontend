"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Gift,
  Settings,
  Menu,
  X,
  LogOut,
  Bell,
  Search,
} from "lucide-react"
import { Suspense } from "react"
import ScrollProgress from "@/components/admin/scroll-progress"

const adminNav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/rewards", label: "Rewards", icon: Gift },
  { href: "/admin/content", label: "Content", icon: Settings },
  { href: "/admin/settings", label: "Settings", icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const pathname = usePathname()

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ScrollProgress />
      <div className="flex h-screen bg-background">
        {/* Sidebar */}
        <div
          className={`${
            sidebarOpen ? "w-64" : "w-20"
          } glass-dark dark:glass transition-all duration-500 ease-in-out border-r border-border fixed h-screen left-0 top-0 z-40 overflow-y-auto`}
        >
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="p-4 border-b border-border">
              <Link href="/admin" className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg gradient-warm flex-shrink-0" />
                {sidebarOpen && <span className="font-bold text-foreground">Admin</span>}
              </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-2">
              {adminNav.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link key={item.href} href={item.href}>
                    <div
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-500 ease-in-out ${
                        isActive
                          ? "bg-accent/20 text-accent glow-warm"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/10"
                      }`}
                    >
                      <Icon size={20} className="flex-shrink-0" />
                      {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
                    </div>
                  </Link>
                )
              })}
            </nav>

            {/* User Footer */}
            <div className="p-4 border-t border-border">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-accent/20 flex-shrink-0" />
                {sidebarOpen && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">Admin</p>
                    <p className="text-xs text-muted-foreground truncate">admin@duneflame.com</p>
                  </div>
                )}
              </div>
              {sidebarOpen && (
                <button className="w-full mt-3 flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-smooth rounded-lg hover:bg-accent/10">
                  <LogOut size={16} />
                  Logout
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div
          className={`${sidebarOpen ? "ml-64" : "ml-20"} flex-1 flex flex-col overflow-hidden transition-all duration-500 ease-in-out`}
        >
          {/* Top Bar */}
          <div className="h-16 glass glow-accent border-b border-border flex items-center justify-between px-6 z-30">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-accent/10 rounded-lg transition-smooth"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <div className="flex-1 max-w-md mx-4 hidden sm:block">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full bg-white/50 dark:bg-white/10 border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-accent/10 rounded-lg transition-smooth relative">
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full" />
              </button>
            </div>
          </div>

          {/* Page Content */}
          <div className="flex-1 overflow-auto">{children}</div>
        </div>
      </div>
    </Suspense>
  )
}
