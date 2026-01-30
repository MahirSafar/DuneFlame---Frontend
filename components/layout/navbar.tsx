"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Menu, X, ShoppingCart, Moon, Sun, User, LogOut } from "lucide-react"
import { useTheme } from "next-themes"
import { useTranslations } from "next-intl"
import { useDarkMode } from "@/lib/dark-mode-context"
import { useAuth } from "@/components/auth/auth-provider"
import { useCartStore } from "@/lib/cart-store"
import { InstantCurrencySwitcher } from "@/components/currency/instant-switcher"
import { LanguageSwitcher } from "./language-switcher"

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isHidden, setIsHidden] = useState(false)
  const { theme, setTheme } = useTheme()
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const { isLoggedIn, logout } = useAuth()
  const { loadBasket, items } = useCartStore()
  const t = useTranslations('common.nav')
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

  const navLinks = [
    { href: "/products", key: "shop" },
    { href: "/about", key: "about" },
    { href: "/contact", key: "contact" },
  ]

  return (
    <>
      {/* Free Shipping Note */}
      {isHidden && (
        <div
          className="w-full text-green-900 text-center py-2 text-sm font-semibold transition-opacity duration-300 animate-in fade-in z-60 fixed top-0 left-0"
          style={{ backgroundColor: "rgb(253, 250, 247)" }}
        >
          🚚 Free Shipping on Orders Over 200 AED in UAE! 🌿
        </div>
      )}
      <nav className={`sticky top-0 z-50 glass glow-accent transition-transform duration-300 ${isHidden ? "-translate-y-full" : "translate-y-0"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <Image
              src="/logo.svg"
              alt="DuneFlame Logo"
              width={192}
              height={192}
              className="w-32 h-32 rounded-full group-hover:scale-110 transition-smooth"
              style={{ display: "block" }}
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-foreground hover:text-accent transition-smooth relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-accent after:transition-smooth hover:after:w-full"
              >
                {t(link.key)}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {/* Language Switcher */}
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>

            {/* Currency Switcher */}
            <div className="hidden sm:block">
              <InstantCurrencySwitcher />
            </div>

            <button
              onClick={() => {
                setTheme(theme === "dark" ? "light" : "dark")
                toggleDarkMode()
              }}
              className="p-2 hover:bg-accent/10 rounded-lg transition-smooth scale-100 hover:scale-110"
            >
              {isDarkMode ? <Sun size={20} className="animate-spin duration-500" /> : <Moon size={20} />}
            </button>
            <Link
              href="/cart"
              className="relative p-2 hover:bg-accent/10 rounded-lg transition-smooth scale-100 hover:scale-110"
            >
              <ShoppingCart size={20} />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -end-1 bg-accent text-accent-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Link>

            {isLoggedIn ? (
              <div className="flex items-center gap-2">
                <Link href="/en/dashboard" className="p-2 hover:bg-accent/10 rounded-lg transition-smooth">
                  <User size={20} />
                </Link>
                <button
                  onClick={() => void logout()}
                  className="px-3 py-2 bg-destructive/5 text-destructive rounded-lg hover:bg-destructive/10 transition-smooth flex items-center gap-2"
                >
                  <LogOut size={16} /> {t('logout')}
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link href="/auth/login" className="px-3 py-2 text-sm font-medium text-foreground hover:text-accent">
                  {t('login')}
                </Link>
                <Link
                  href="/register"
                  className="px-3 py-2 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold rounded-lg"
                >
                  {t('register')}
                </Link>
              </div>
            )}

            <button
              className="md:hidden p-2 hover:bg-accent/10 rounded-lg transition-smooth"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden pb-4 border-t border-border animate-in slide-in-from-top duration-300">
            <div className="px-4 py-3 flex items-center justify-center gap-2">
              <LanguageSwitcher />
              <InstantCurrencySwitcher />
            </div>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block py-2 text-sm font-medium text-foreground hover:text-accent transition-smooth"
                onClick={() => setIsOpen(false)}
              >
                {t(link.key)}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2 px-4">
              {isLoggedIn ? (
                <>
                  <Link href="/en/dashboard" className="py-2 text-sm font-medium">
                    Profile
                  </Link>
                  <button onClick={() => void logout()} className="py-2 text-left text-sm text-destructive">
                    {t('logout')}
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="py-2 text-sm font-medium">
                    {t('login')}
                  </Link>
                  <Link href="/register" className="py-2 text-sm font-medium">
                    {t('register')}
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
      </nav>
    </>
  )
}
