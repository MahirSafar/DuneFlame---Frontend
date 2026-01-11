"use client"

import Link from "next/link"

const CATEGORIES = [
  {
    name: "Coffee Beans",
    count: "12+ Origins",
    href: "/products?category=beans",
    icon: "🌍",
  },
  {
    name: "Capsules",
    count: "8 Varieties",
    href: "/products?category=capsules",
    icon: "💊",
  },
  {
    name: "Equipment",
    count: "Premium Gear",
    href: "/products?category=equipment",
    icon: "⚙️",
  },
  {
    name: "Accessories",
    count: "Essentials",
    href: "/products?category=accessories",
    icon: "🎁",
  },
]

export default function Categories() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 grain-bg dark:grain-bg">
      <h2 className="text-4xl font-bold text-primary dark:text-secondary mb-12 text-center text-balance">
        Shop by Category
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {CATEGORIES.map((category, idx) => (
          <Link key={category.name} href={category.href}>
            <div
              className={`glass rounded-xl p-8 text-center group cursor-pointer hover:glow-warm transition-all duration-500 ease-in-out h-full card-depth card-float animate-in fade-in duration-700`}
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="text-5xl mb-4 group-hover:animate-float transition-smooth">{category.icon}</div>
              <h3 className="text-xl font-bold text-primary dark:text-secondary mb-2 group-hover:text-accent transition-all duration-500 ease-in-out">
                {category.name}
              </h3>
              <p className="text-sm text-muted-foreground group-hover:text-muted-foreground/70 transition-smooth">
                {category.count}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
