"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Link, usePathname, useRouter } from "@/i18n/routing"
import { useAuthStore } from "@/lib/auth-store"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Users2,
  Mail,
  Menu,
  X,
  LogOut,
  Bell,
  Search,
  Loader2,
  GalleryHorizontal,
} from "lucide-react"
import { Suspense } from "react"
import { useTranslations } from "next-intl"

const adminNav = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Coffee", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/sliders", label: "Sliders", icon: GalleryHorizontal },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/contacts", label: "Contacts", icon: Mail },
  { href: "/admin/subscribers", label: "Subscribers", icon: Users2 },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isChecking, setIsChecking] = useState(true)
  const t = useTranslations("common.actions")
  
  // --- YENİ: Hydration State ---
  // Store-un yaddaşdan oxunub-oxunmadığını izləmək üçün
  const [isHydrated, setIsHydrated] = useState(false) 

  const pathname = usePathname()
  const router = useRouter()
  const { user, accessToken, logout } = useAuthStore()
  const isLoginPage = pathname === "/admin/login"

  // 1. HYDRATION CHECK (ƏN VACİB HİSSƏ)
  useEffect(() => {
    // Zustand-ın persist obyekti vasitəsilə yaddaşın yüklənib-yüklənmədiyini yoxlayırıq
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setIsHydrated(true)
    })

    // Əgər biz component mount olanda artıq yüklənibsə
    if (useAuthStore.persist.hasHydrated()) {
      setIsHydrated(true)
    }

    return () => {
      unsub()
    }
  }, [])

  // 2. SECURITY CHECK
  useEffect(() => {
    // Əgər hələ yaddaşdan oxumaq bitməyibsə, heç nə etmə (GÖZLƏ)
    if (!isHydrated) return

    if (isLoginPage) {
      setIsChecking(false)
      return
    }

    const hasToken = Boolean(accessToken)
    const isAdmin = Boolean(user?.roles?.includes("Admin"))

    if (!hasToken || !isAdmin) {
      router.replace("/admin/login")
      return
    }

    setIsChecking(false)
  }, [isHydrated, accessToken, isLoginPage, router, user]) // isHydrated bura əlavə olundu

  const handleLogout = async () => {
    await logout()
    router.replace("/admin/login")
  }

  // Yüklənir (həm Auth yoxlanışı, həm də Storage Hydration zamanı)
  if (!isLoginPage && (isChecking || !isHydrated)) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-accent" />
          <p className="text-sm font-medium text-muted-foreground">
            {t("loading")}
          </p>
        </div>
      </div>
    )
  }

  return (
    <Suspense fallback={<div>{t("loading")}</div>}>
      <div className="flex h-screen bg-background">
        {/* Sidebar */}
        {!isLoginPage && (
          <div
            className={`${
              sidebarOpen ? "w-64" : "w-20"
            } glass-dark dark:glass transition-all duration-500 ease-in-out border-r border-border fixed h-screen left-0 top-0 z-40 overflow-y-auto`}
          >
            <div className="flex flex-col h-full">
              {/* Logo */}
              <div className="p-4 border-b border-border">
                <Link href="/admin" className="flex items-center gap-3">
                  <img
                    src="/logo.svg"
                    alt="DuneFlame Logo"
                    className="w-8 h-8 rounded-lg shrink-0"
                  />
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
                        <Icon size={20} className="shrink-0" />
                        {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
                      </div>
                    </Link>
                  )
                })}
              </nav>

              {/* User Footer */}
              <div className="p-4 border-t border-border">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent/20 shrink-0" />
                  {sidebarOpen && (
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {user ? `${user.firstName} ${user.lastName}` : "Admin"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user?.email || "admin@duneflame.com"}
                      </p>
                    </div>
                  )}
                </div>
                {sidebarOpen && (
                  <button
                    onClick={handleLogout}
                    className="w-full mt-3 flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-smooth rounded-lg hover:bg-accent/10"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div
          className={`${!isLoginPage && (sidebarOpen ? "ml-64" : "ml-20")} flex-1 flex flex-col overflow-hidden transition-all duration-500 ease-in-out`}
        >
          {/* Top Bar */}
          {!isLoginPage && (
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
          )}

          {/* Page Content */}
          <div className="flex-1 overflow-auto">{children}</div>
        </div>
      </div>
    </Suspense>
  )
}
