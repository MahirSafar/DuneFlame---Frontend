"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Menu, X, User, LogOut, ShoppingBag, Search, ChevronUp } from "lucide-react"
import { useTranslations } from "next-intl"
import { useAuth } from "@/components/auth/auth-provider"
import { useCartStore } from "@/lib/cart-store"
import { InstantCurrencySwitcher } from "@/components/currency/instant-switcher"
import { LanguageSwitcher } from "./language-switcher"

export default function Navbar() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isHidden, setIsHidden] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const { isLoggedIn, logout } = useAuth()
  const { loadBasket, items } = useCartStore()
  const t = useTranslations('common.nav')
  const tFooter = useTranslations('common.footer')
  const lastScrollY = useRef(0)

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
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`)
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

  const navLinks = [
    { href: "/products", key: "our-coffee", label: t('ourCoffee') },
    { href: "/wholesale", key: "wholesale", label: t('wholesale') },
    { href: "/about", key: "about", label: t('aboutUs') },
    { href: "/contact", key: "contact" },
  ]

  return (
    <>
      {/* Free Shipping Note */}
      {isHidden && (
        <div
          className="w-full text-center py-2 text-sm font-semibold transition-opacity duration-300 animate-in fade-in z-60 fixed top-0 left-0"
          style={{ backgroundColor: "#2b1b13", color: "white" }}
        >
          {tFooter('freeShippingBanner')}
        </div>
      )}
      <nav 
        className={`sticky top-0 z-50 glass transition-transform duration-300 ${isSearchOpen || isHidden ? "-translate-y-full" : "translate-y-0"}`}
        style={{ boxShadow: "0 8px 16px rgba(230, 211, 191, 0.5)" }}
      >
        <div className="w-full px-4 sm:px-6 md:px-10">
        <div className="relative flex items-center h-16 sm:h-20 gap-3 sm:gap-6">
          {/* Logo - Left Side */}
          <Link href="/" className="flex items-center gap-2 group flex-shrink-0 z-10">
            <Image
              src="/logo.svg"
              alt="DuneFlame Logo"
              width={96}
              height={96}
              className="w-6 sm:w-9 md:w-10 h-6 sm:h-9 md:h-10 rounded-full group-hover:scale-110 transition-smooth"
              style={{ display: "block" }}
            />
          </Link>

          {/* Desktop Navigation - True Center */}
          <div className="hidden lg:flex items-center gap-6 lg:gap-8 absolute left-1/2 transform -translate-x-1/2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-heading uppercase tracking-wide text-foreground hover:text-accent transition-smooth relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-accent after:transition-smooth hover:after:w-full"
              >
                {link.label ? link.label : t(link.key)}
              </Link>
            ))}
          </div>

          {/* Right Actions - Right Side */}
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-shrink-0 ml-auto z-10" suppressHydrationWarning>
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
              className="relative p-1.5 sm:p-2 hover:bg-accent/10 rounded-lg transition-smooth scale-100 hover:scale-110"
            >
              <ShoppingBag size={18} className="sm:w-5 sm:h-5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -end-1 bg-accent text-accent-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Link>

            {/* Profile - Always visible */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => router.push(isLoggedIn ? "/dashboard" : "/login")}
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
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block py-2 px-4 text-sm font-heading uppercase tracking-wide text-foreground hover:text-accent transition-smooth text-left"
                onClick={() => setIsOpen(false)}
              >
                {link.label ? link.label : t(link.key)}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-3 px-4">
              <div className="pt-3 border-t border-border flex items-center gap-2">
                <div className="[&>button]:!bg-white [&>button]:!border-[#4B2E2B] [&>button]:!text-[#4B2E2B] [&>button]:hover:!bg-gray-50">
                  <LanguageSwitcher />
                </div>
                <div className="[&>button]:!bg-white [&>button]:!border-[#4B2E2B] [&>button]:!text-[#4B2E2B] [&>button]:hover:!bg-gray-50">
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
