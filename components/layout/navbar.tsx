"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Menu, X, User, LogOut, ShoppingBag, Search, ChevronUp, ChevronDown, ChevronRight } from "lucide-react"
import { useTranslations } from "next-intl"
import { Link, useRouter } from "@/i18n/routing"
import { useAuth } from "@/components/auth/auth-provider"
import { useCartStore } from "@/lib/cart-store"
import { InstantCurrencySwitcher } from "@/components/currency/instant-switcher"
import { LanguageSwitcher } from "./language-switcher"
import { getCategoryTree, type CategoryTreeNode } from "@/lib/services/products"

// Helper: flatten a CategoryTreeNode subtree into leaf links
function getLeafLinks(node: CategoryTreeNode): CategoryTreeNode[] {
  if (!node.children || node.children.length === 0) return [node]
  return node.children.flatMap(getLeafLinks)
}

export default function Navbar() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isHidden, setIsHidden] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [openMobileEquipSub, setOpenMobileEquipSub] = useState<string | null>(null)
  const [coffeeNode, setCoffeeNode] = useState<CategoryTreeNode | null>(null)
  const [equipmentNode, setEquipmentNode] = useState<CategoryTreeNode | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { isLoggedIn, logout } = useAuth()
  const { loadBasket, items } = useCartStore()
  const t = useTranslations('common.nav')
  const tFooter = useTranslations('common.footer')
  const lastScrollY = useRef(0)
  const [activeBannerIndex, setActiveBannerIndex] = useState(0)

  const bannerMessages = [
    tFooter('freeShippingBanner'),
    "🎉 10% Welcome Discount on your first order!"
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveBannerIndex((prev) => (prev + 1) % bannerMessages.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [bannerMessages.length])

  // Load basket from backend when user logs in
  useEffect(() => {
    if (isLoggedIn) {
      loadBasket()
    }
  }, [isLoggedIn, loadBasket])

  useEffect(() => {
    const handleScroll = () => {
      if (isOpen) {
        setIsHidden(false)
        return
      }

      const current = window.scrollY
      const delta = current - lastScrollY.current
      const scrolledDown = delta > 6 && current > 20
      const scrolledUp = delta < -20 || current <= 20

      if (scrolledDown) setIsHidden(true)
      if (scrolledUp) setIsHidden(false)

      lastScrollY.current = current
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [isOpen])

  // Calculate total items count
  const cartItemCount = items.reduce((total, item) => total + item.quantity, 0)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/coffee?search=${encodeURIComponent(searchQuery)}`)
      setIsSearchOpen(false)
      setSearchQuery("")
    }
  }

  // Close search when mobile menu opens
  useEffect(() => {
    if (isOpen) {
      setIsSearchOpen(false)
    }
  }, [isOpen])

  // Fetch category tree once on mount to build nav dropdowns
  useEffect(() => {
    getCategoryTree().then((tree) => {
      // tree is [root] or [coffee, equipment, ...] depending on backend
      const flat = tree.flatMap((n) =>
        n.name.toLowerCase() === "root" ? n.children : [n]
      )
      setCoffeeNode(flat.find((n) => n.name.toLowerCase() === "coffee") ?? null)
      setEquipmentNode(flat.find((n) => n.name.toLowerCase() === "equipment") ?? null)
    }).catch(() => { /* silently degrade */ })
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const staticLinks = [
    { href: "/wholesale", label: t('wholesale') },
    { href: "/about", label: t('aboutUs') },
    { href: "/contact", label: t('contact') },
  ]

  return (
    <>
      {/* Free Shipping Note */}
      {isHidden && (
        <div
          className="w-full text-center text-sm font-semibold transition-opacity duration-300 animate-in fade-in z-60 fixed top-0 left-0 overflow-hidden h-9"
          style={{ backgroundColor: "#2b1b13", color: "white" }}
        >
          <div
            className="flex flex-col transition-transform duration-500 ease-in-out w-full"
            style={{ transform: `translateY(-${activeBannerIndex * 36}px)` }}
          >
            {bannerMessages.map((msg, idx) => (
              <div
                key={idx}
                className="flex items-center justify-center w-full h-9 px-4 shrink-0"
              >
                {msg}
              </div>
            ))}
          </div>
        </div>
      )}
      <nav 
        className={`sticky top-0 z-50 glass transition-transform duration-300 ${isSearchOpen || isHidden ? "-translate-y-full" : "translate-y-0"}`}
        style={{ boxShadow: "0 8px 16px rgba(230, 211, 191, 0.5)" }}
      >
        <div className="w-full px-4 sm:px-6 md:px-10">
        <div className="relative flex items-center h-16 sm:h-20 gap-3 sm:gap-6">
          {/* Logo - Left Side */}
          <Link href="/" aria-label="DuneFlame Home" className="flex items-center gap-2 group shrink-0 z-10">
            <Image
              src="/logo.svg"
              alt="DuneFlame Logo"
              width={96}
              height={96}
              quality={60}
              className="w-12 sm:w-14 md:w-16 h-12 sm:h-14 md:h-16 object-contain group-hover:scale-110 transition-smooth"
              style={{ display: "block" }}
            />
          </Link>

          {/* Desktop Navigation - True Center */}
          <div ref={dropdownRef} className="hidden lg:flex items-center gap-6 lg:gap-8 absolute left-1/2 transform -translate-x-1/2">
            {/* Coffee dropdown */}
            <div className="relative">
              <button
                className="flex items-center gap-1 text-sm font-heading uppercase tracking-wide text-foreground hover:text-accent transition-smooth"
                onClick={() => setOpenDropdown(openDropdown === "coffee" ? null : "coffee")}
                aria-expanded={openDropdown === "coffee"}
              >
                {t('ourCoffee')}
                <ChevronDown size={14} className={`transition-transform duration-200 ${openDropdown === "coffee" ? "rotate-180" : ""}`} />
              </button>
              {openDropdown === "coffee" && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 min-w-45 glass rounded-xl border border-border/60 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <Link
                    href={{ pathname: "/shop", query: { category: "coffee" } }}
                    className="block px-4 py-2 text-sm font-semibold text-foreground hover:text-accent hover:bg-accent/5 transition-smooth"
                    onClick={() => setOpenDropdown(null)}
                  >
                    All Coffee
                  </Link>
                  {coffeeNode && getLeafLinks(coffeeNode).map((leaf) => (
                    <Link
                      key={leaf.id}
                      href={{ pathname: "/shop", query: { category: leaf.slug ?? leaf.name.toLowerCase().replace(/\s+/g, "-") } }}
                      className="block px-4 py-2 text-sm text-foreground hover:text-accent hover:bg-accent/5 transition-smooth capitalize"
                      onClick={() => setOpenDropdown(null)}
                    >
                      {leaf.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Equipment dropdown */}
            <div className="relative">
              <button
                className="flex items-center gap-1 text-sm font-heading uppercase tracking-wide text-foreground hover:text-accent transition-smooth"
                onClick={() => setOpenDropdown(openDropdown === "equipment" ? null : "equipment")}
                aria-expanded={openDropdown === "equipment"}
              >
                Equipment
                <ChevronDown size={14} className={`transition-transform duration-200 ${openDropdown === "equipment" ? "rotate-180" : ""}`} />
              </button>
              {openDropdown === "equipment" && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 min-w-52 glass rounded-xl border border-border/60 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <Link
                    href={{ pathname: "/shop", query: { category: "equipment" } }}
                    className="block px-4 py-2 text-sm font-semibold text-foreground hover:text-accent hover:bg-accent/5 transition-smooth"
                    onClick={() => setOpenDropdown(null)}
                  >
                    All Equipment
                  </Link>
                  <div className="my-1 border-t border-border/40" />
                  {equipmentNode?.children?.map((sub) =>
                    sub.children && sub.children.length > 0 ? (
                      /* L2 item with L3 children → hover flyout to the right */
                      <div key={sub.id} className="relative group/sub">
                        <Link
                          href={{ pathname: "/shop", query: { category: sub.slug ?? sub.name.toLowerCase().replace(/\s+/g, "-") } }}
                          className="flex items-center justify-between px-4 py-2 text-sm text-foreground hover:text-accent hover:bg-accent/5 transition-smooth capitalize gap-2"
                          onClick={() => setOpenDropdown(null)}
                        >
                          {sub.name}
                          <ChevronRight size={12} className="text-muted-foreground group-hover/sub:text-accent rtl:rotate-180 shrink-0" />
                        </Link>
                        {/* L3 flyout — slides out to the right (rtl: to the left) */}
                        <div className="absolute left-full top-0 -mt-1 hidden group-hover/sub:flex flex-col min-w-44 glass rounded-xl border border-border/60 shadow-xl py-2 z-60 rtl:right-full rtl:left-auto">
                          <Link
                            href={{ pathname: "/shop", query: { category: sub.slug ?? sub.name.toLowerCase().replace(/\s+/g, "-") } }}
                            className="block px-4 py-1.5 text-xs font-semibold text-muted-foreground hover:text-accent hover:bg-accent/5 transition-smooth capitalize border-b border-border/40 mb-1"
                            onClick={() => setOpenDropdown(null)}
                          >
                            All {sub.name}
                          </Link>
                          {sub.children.map((leaf) => (
                            <Link
                              key={leaf.id}
                              href={{ pathname: "/shop", query: { category: leaf.slug ?? leaf.name.toLowerCase().replace(/\s+/g, "-") } }}
                              className="block px-4 py-2 text-sm text-foreground hover:text-accent hover:bg-accent/5 transition-smooth capitalize"
                              onClick={() => setOpenDropdown(null)}
                            >
                              {leaf.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ) : (
                      /* L2 leaf (no children) */
                      <Link
                        key={sub.id}
                        href={{ pathname: "/shop", query: { category: sub.slug ?? sub.name.toLowerCase().replace(/\s+/g, "-") } }}
                        className="block px-4 py-2 text-sm text-foreground hover:text-accent hover:bg-accent/5 transition-smooth capitalize"
                        onClick={() => setOpenDropdown(null)}
                      >
                        {sub.name}
                      </Link>
                    )
                  )}
                </div>
              )}
            </div>

            {/* Static links */}
            {staticLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-heading uppercase tracking-wide text-foreground hover:text-accent transition-smooth relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-accent after:transition-smooth hover:after:w-full"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Actions - Right Side */}
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 shrink-0 ml-auto z-10" suppressHydrationWarning>
            {/* Language Switcher */}
            <div className="hidden md:block navbar-switcher" suppressHydrationWarning>
              <LanguageSwitcher />
            </div>

            {/* Currency Switcher */}
            <div className="hidden md:block navbar-switcher" suppressHydrationWarning>
              <InstantCurrencySwitcher />
            </div>

            {/* Search Icon */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-1.5 sm:p-2 hover:bg-accent/10 rounded-lg transition-smooth scale-100 hover:scale-110"
              aria-label="Search"
            >
              <Search size={18} className="sm:w-5 sm:h-5" />
            </button>

            {/* Basket */}
            <Link
              href="/cart"
              aria-label="Shopping Cart"
              className="relative p-1.5 sm:p-2 hover:bg-accent/10 rounded-lg transition-smooth scale-100 hover:scale-110"
            >
              <ShoppingBag size={18} className="sm:w-5 sm:h-5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -inset-e-1 bg-accent text-accent-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Link>

            {/* Profile - Always visible */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => router.push(isLoggedIn ? "/dashboard" : "/auth/login")}
                className="p-1.5 sm:p-2 hover:bg-accent/10 rounded-lg transition-smooth"
                aria-label="Profile"
              >
                <User size={18} className="sm:w-5 sm:h-5" />
              </button>
              {isLoggedIn && (
                <button
                  onClick={() => void logout()}
                  className="p-1.5 sm:p-2 transition-smooth flex items-center"
                  aria-label="Logout"
                >
                  <LogOut size={18} className="sm:w-5 sm:h-5" style={{ color: "#4B2E2B" }} />
                </button>
              )}
            </div>

            {/* Mobile/Tablet Menu Button */}
            <button
              aria-label="Toggle menu"
              className="lg:hidden p-1.5 sm:p-2 hover:bg-accent/10 rounded-lg transition-smooth"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="lg:hidden pb-4 border-t border-border animate-in slide-in-from-top duration-300">
            {/* Coffee group */}
            <div className="py-1 px-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-2">{t('ourCoffee')}</div>
              <Link href={{ pathname: "/shop", query: { category: "coffee" } }} className="block py-1.5 pl-2 text-sm text-foreground hover:text-accent transition-smooth" onClick={() => setIsOpen(false)}>All Coffee</Link>
              {coffeeNode && getLeafLinks(coffeeNode).map((leaf) => (
                <Link key={leaf.id} href={{ pathname: "/shop", query: { category: leaf.slug ?? leaf.name.toLowerCase().replace(/\s+/g, "-") } }} className="block py-1.5 pl-2 text-sm text-foreground hover:text-accent transition-smooth capitalize" onClick={() => setIsOpen(false)}>{leaf.name}</Link>
              ))}
            </div>
            {/* Equipment group */}
            <div className="py-1 px-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-2">Equipment</div>
              <Link href={{ pathname: "/shop", query: { category: "equipment" } }} className="block py-1.5 pl-2 text-sm text-foreground hover:text-accent transition-smooth" onClick={() => setIsOpen(false)}>All Equipment</Link>
              {equipmentNode?.children?.map((sub) =>
                sub.children && sub.children.length > 0 ? (
                  /* L2 with children → collapsible accordion */
                  <div key={sub.id}>
                    <button
                      className="flex items-center justify-between w-full py-1.5 pl-2 text-sm text-foreground hover:text-accent transition-smooth capitalize"
                      onClick={() => setOpenMobileEquipSub(openMobileEquipSub === sub.id ? null : sub.id)}
                    >
                      {sub.name}
                      <ChevronDown size={14} className={`transition-transform duration-200 mr-1 shrink-0 ${openMobileEquipSub === sub.id ? "rotate-180" : ""}`} />
                    </button>
                    {openMobileEquipSub === sub.id && (
                      <div className="pl-3 border-l-2 border-accent/30 ml-2 my-1 flex flex-col gap-0.5">
                        <Link
                          href={{ pathname: "/shop", query: { category: sub.slug ?? sub.name.toLowerCase().replace(/\s+/g, "-") } }}
                          className="block py-1.5 pl-2 text-xs font-semibold text-muted-foreground hover:text-accent transition-smooth capitalize"
                          onClick={() => setIsOpen(false)}
                        >
                          All {sub.name}
                        </Link>
                        {sub.children.map((leaf) => (
                          <Link
                            key={leaf.id}
                            href={{ pathname: "/shop", query: { category: leaf.slug ?? leaf.name.toLowerCase().replace(/\s+/g, "-") } }}
                            className="block py-1.5 pl-2 text-sm text-foreground hover:text-accent transition-smooth capitalize"
                            onClick={() => setIsOpen(false)}
                          >
                            {leaf.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  /* L2 leaf */
                  <Link
                    key={sub.id}
                    href={{ pathname: "/shop", query: { category: sub.slug ?? sub.name.toLowerCase().replace(/\s+/g, "-") } }}
                    className="block py-1.5 pl-2 text-sm text-foreground hover:text-accent transition-smooth capitalize"
                    onClick={() => setIsOpen(false)}
                  >
                    {sub.name}
                  </Link>
                )
              )}
            </div>
            {/* Static links */}
            {staticLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block py-2 px-4 text-sm font-heading uppercase tracking-wide text-foreground hover:text-accent transition-smooth text-left"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-3 px-4">
              <div className="pt-3 border-t border-border flex items-center gap-2">
                <div className="[&>button]:bg-white! [&>button]:border-[#4B2E2B]! [&>button]:text-[#4B2E2B]! [&>button]:hover:bg-gray-50!">
                  <LanguageSwitcher />
                </div>
                <div className="[&>button]:bg-white! [&>button]:border-[#4B2E2B]! [&>button]:text-[#4B2E2B]! [&>button]:hover:bg-gray-50!">
                  <InstantCurrencySwitcher />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      </nav>

      {/* Search Panel - Slides down from top */}
      {isSearchOpen && (
        <div className="fixed top-0 left-0 right-0 z-40 glass border-b border-border animate-in slide-in-from-top duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <form onSubmit={handleSearch} className="flex gap-2 items-center">
              <Search size={20} className="text-foreground/70" />
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="flex-1 px-0 py-2 bg-transparent text-foreground placeholder:text-foreground/50 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  setIsSearchOpen(false)
                  setSearchQuery("")
                }}
                className="p-2 hover:bg-accent/10 rounded-lg transition-smooth"
              >
                <ChevronUp size={20} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
