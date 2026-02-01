"use client"

import { useState, useEffect } from "react"
import { ChevronDown } from "lucide-react"
import { getCategories, getOrigins, type Category, type Origin } from "@/lib/services/products"
import { useTranslations } from "next-intl"

interface FilterSidebarProps {
  onFilterChange: (filters: FilterState) => void
  minPrice?: number
  maxPrice?: number
}

export interface FilterState {
  roastLevel: number[]
  originIds: string[]
  categoryIds: string[]
  priceRange: [number, number]
}

const ROAST_LEVELS = [
  { value: 1, labelKey: "products.filters.light" },
  { value: 2, labelKey: "products.filters.lightMedium" },
  { value: 3, labelKey: "products.filters.medium" },
  { value: 4, labelKey: "products.filters.mediumDark" },
  { value: 5, labelKey: "products.filters.dark" },
]

export default function FilterSidebar({ onFilterChange, minPrice = 0, maxPrice = 100 }: FilterSidebarProps) {
  const t = useTranslations()
  const [filters, setFilters] = useState<FilterState>({
    roastLevel: [],
    originIds: [],
    categoryIds: [],
    priceRange: [minPrice, maxPrice],
  })
  const [expandedSections, setExpandedSections] = useState({
    roast: false,
    origin: false,
    category: false,
    price: false,
  })
  const [categories, setCategories] = useState<Category[]>([])
  const [origins, setOrigins] = useState<Origin[]>([])
  const [loading, setLoading] = useState(true)

  // Update price range when min/max prices change
  useEffect(() => {
    if (minPrice !== undefined && maxPrice !== undefined) {
      setFilters(prev => ({
        ...prev,
        priceRange: [minPrice, maxPrice],
      }))
      onFilterChange({
        roastLevel: [],
        originIds: [],
        categoryIds: [],
        priceRange: [minPrice, maxPrice],
      })
    }
  }, [minPrice, maxPrice, onFilterChange])

  useEffect(() => {
    Promise.all([getCategories(), getOrigins()])
      .then(([cats, orgs]) => {
        setCategories(cats)
        setOrigins(orgs)
      })
      .catch((err) => console.error("Failed to load filter data:", err))
      .finally(() => setLoading(false))
  }, [])

  const handleRoastChange = (level: number) => {
    const newRoastLevel = filters.roastLevel.includes(level)
      ? filters.roastLevel.filter((r) => r !== level)
      : [...filters.roastLevel, level]

    const newFilters = { ...filters, roastLevel: newRoastLevel }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleOriginChange = (originId: string) => {
    const newOriginIds = filters.originIds.includes(originId)
      ? filters.originIds.filter((o) => o !== originId)
      : [...filters.originIds, originId]

    const newFilters = { ...filters, originIds: newOriginIds }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleCategoryChange = (categoryId: string) => {
    const newCategoryIds = filters.categoryIds.includes(categoryId)
      ? filters.categoryIds.filter((c) => c !== categoryId)
      : [...filters.categoryIds, categoryId]

    const newFilters = { ...filters, categoryIds: newCategoryIds }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const isCurrentlyExpanded = prev[section as keyof typeof prev]
      // Close all sections first, then open the clicked one (unless it's already open)
      return {
        roast: false,
        origin: false,
        category: false,
        price: false,
        [section]: !isCurrentlyExpanded,
      }
    })
  }

  if (loading) {
    return (
      <aside className="glass rounded-xl p-6 h-fit sticky top-24">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-3/4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded"></div>
          </div>
        </div>
      </aside>
    )
  }

  return (
    <aside className="glass rounded-xl p-6 h-fit sticky top-24">
      {/* Categories */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection("category")}
          className="w-full flex justify-between items-center mb-4 text-sm font-semibold transition-smooth uppercase"
          style={{ color: '#4B2E2B' }}
        >
          {t('products.filters.category')}
          <ChevronDown size={18} className={`transition-transform rtl:rotate-180 ${expandedSections.category ? "" : "-rotate-90"}`} />
        </button>

        {expandedSections.category && (
          <div className="space-y-3">
            {categories.map((category) => (
              <label key={category.id} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.categoryIds.includes(category.id)}
                  onChange={() => handleCategoryChange(category.id)}
                  className="rounded border-border accent-accent"
                />
                <span className="text-sm" style={{ color: '#4B2E2B' }}>
                  {category.name}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="h-px bg-border mb-6" />

      {/* Roast Level */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection("roast")}
          className="w-full flex justify-between items-center mb-4 text-sm font-semibold transition-smooth uppercase"
          style={{ color: '#4B2E2B' }}
        >
          {t('products.filters.roastLevel')}
          <ChevronDown size={18} className={`transition-transform rtl:rotate-180 ${expandedSections.roast ? "" : "-rotate-90"}`} />
        </button>

        {expandedSections.roast && (
          <div className="space-y-3">
            {ROAST_LEVELS.map((level) => (
              <label key={level.value} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.roastLevel.includes(level.value)}
                  onChange={() => handleRoastChange(level.value)}
                  className="rounded border-border accent-accent"
                />
                <span className="text-sm" style={{ color: '#4B2E2B' }}>
                  {t(level.labelKey)}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="h-px bg-border mb-6" />

      {/* Origin */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection("origin")}
          className="w-full flex justify-between items-center mb-4 text-sm font-semibold transition-smooth uppercase"
          style={{ color: '#4B2E2B' }}
        >
          {t('products.filters.origin')}
          <ChevronDown size={18} className={`transition-transform rtl:rotate-180 ${expandedSections.origin ? "" : "-rotate-90"}`} />
        </button>

        {expandedSections.origin && (
          <div className="space-y-3">
            {origins.map((origin) => (
              <label key={origin.id} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.originIds.includes(origin.id)}
                  onChange={() => handleOriginChange(origin.id)}
                  className="rounded border-border accent-accent"
                />
                <span className="text-sm" style={{ color: '#4B2E2B' }}>
                  {origin.name}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="h-px bg-border mb-6" />

      {/* Price Range */}
      <div>
        <button
          onClick={() => toggleSection("price")}
          className="w-full flex justify-between items-center mb-4 text-sm font-semibold transition-smooth uppercase"
          style={{ color: '#4B2E2B' }}
        >
          {t('products.filters.priceRange')}
          <ChevronDown size={18} className={`transition-transform rtl:rotate-180 ${expandedSections.price ? "" : "-rotate-90"}`} />
        </button>

        {expandedSections.price && (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Min Price: ${filters.priceRange[0]}</label>
              <input
                type="range"
                min={minPrice}
                max={maxPrice}
                value={filters.priceRange[0]}
                onChange={(e) => {
                  const newMin = Number(e.target.value)
                  if (newMin <= filters.priceRange[1]) {
                    const newFilters = {
                      ...filters,
                      priceRange: [newMin, filters.priceRange[1]] as [number, number],
                    }
                    setFilters(newFilters)
                    onFilterChange(newFilters)
                  }
                }}
                className="w-full accent-accent"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Max Price: ${filters.priceRange[1]}</label>
              <input
                type="range"
                min={minPrice}
                max={maxPrice}
                value={filters.priceRange[1]}
                onChange={(e) => {
                  const newMax = Number(e.target.value)
                  if (newMax >= filters.priceRange[0]) {
                    const newFilters = {
                      ...filters,
                      priceRange: [filters.priceRange[0], newMax] as [number, number],
                    }
                    setFilters(newFilters)
                    onFilterChange(newFilters)
                  }
                }}
                className="w-full accent-accent"
              />
            </div>
            <div className="text-sm font-semibold text-foreground">
              ${filters.priceRange[0]} - ${filters.priceRange[1]}
            </div>
          </div>
        )}
      </div>

      <button 
        onClick={() => {
          const resetFilters: FilterState = {
            roastLevel: [],
            originIds: [],
            categoryIds: [],
            priceRange: [minPrice, maxPrice],
          }
          setFilters(resetFilters)
          onFilterChange(resetFilters)
        }}
        className="w-full mt-6 px-4 py-2 border border-border rounded-lg text-sm font-semibold hover:bg-accent/10 transition-smooth"
      >
        {t('products.filters.clearAll')}
      </button>
    </aside>
  )
}
