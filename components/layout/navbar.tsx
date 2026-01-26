"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Menu, X, ShoppingCart, Moon, Sun, User, LogOut } from "lucide-react"
import { useTheme } from "next-themes"
import { useDarkMode } from "@/lib/dark-mode-context"
import { useAuth } from "@/components/auth/auth-provider"
import { useCartStore } from "@/lib/cart-store"
import { InstantCurrencySwitcher } from "@/components/currency/instant-switcher"

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const { isLoggedIn, logout } = useAuth()
  const { loadBasket, items } = useCartStore()

  // Load basket from backend when user logs in
  useEffect(() => {
    if (isLoggedIn) {
      loadBasket()
    }
  }, [isLoggedIn, loadBasket])

  // Calculate total items count
  const cartItemCount = items.reduce((total, item) => total + item.quantity, 0)

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/products", label: "Shop" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ]

  return (
    <nav className="sticky top-0 z-50 glass glow-accent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-full gradient-warm group-hover:scale-110 transition-smooth" />
            <span className="text-xl font-bold text-primary dark:text-secondary group-hover:text-accent transition-smooth">
              DuneFlame
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-foreground hover:text-accent transition-smooth relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-accent after:transition-smooth hover:after:w-full"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
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
                <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Link>

            {isLoggedIn ? (
              <div className="flex items-center gap-2">
                <Link href="/profile" className="p-2 hover:bg-accent/10 rounded-lg transition-smooth">
                  <User size={20} />
                </Link>
                <button
                  onClick={() => void logout()}
                  className="px-3 py-2 bg-destructive/5 text-destructive rounded-lg hover:bg-destructive/10 transition-smooth flex items-center gap-2"
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link href="/auth/login" className="px-3 py-2 text-sm font-medium text-foreground hover:text-accent">
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-3 py-2 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold rounded-lg"
                >
                  Sign Up
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
            <div className="px-4 py-3 flex items-center justify-center">
              <InstantCurrencySwitcher />
            </div>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block py-2 text-sm font-medium text-foreground hover:text-accent transition-smooth"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2 px-4">
              {isLoggedIn ? (
                <>
                  <Link href="/profile" className="py-2 text-sm font-medium">
                    Profile
                  </Link>
                  <button onClick={() => void logout()} className="py-2 text-left text-sm text-destructive">
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="py-2 text-sm font-medium">
                    Sign In
                  </Link>
                  <Link href="/register" className="py-2 text-sm font-medium">
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
