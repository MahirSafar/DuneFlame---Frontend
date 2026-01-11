"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

interface FilterSidebarProps {
  onFilterChange: (filters: FilterState) => void
}

export interface FilterState {
  roastLevel: string[]
  origin: string[]
  priceRange: [number, number]
}

export default function FilterSidebar({ onFilterChange }: FilterSidebarProps) {
  const [filters, setFilters] = useState<FilterState>({
    roastLevel: [],
    origin: [],
    priceRange: [0, 100],
  })
  const [expandedSections, setExpandedSections] = useState({
    roast: true,
    origin: true,
    price: true,
  })

  const handleRoastChange = (level: string) => {
    const newRoastLevel = filters.roastLevel.includes(level)
      ? filters.roastLevel.filter((r) => r !== level)
      : [...filters.roastLevel, level]

    const newFilters = { ...filters, roastLevel: newRoastLevel }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleOriginChange = (origin: string) => {
    const newOrigin = filters.origin.includes(origin)
      ? filters.origin.filter((o) => o !== origin)
      : [...filters.origin, origin]

    const newFilters = { ...filters, origin: newOrigin }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  return (
    <aside className="glass rounded-xl p-6 h-fit sticky top-24">
      {/* Roast Level */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection("roast")}
          className="w-full flex justify-between items-center mb-4 font-semibold text-primary dark:text-secondary hover:text-accent transition-smooth"
        >
          Roast Level
          <ChevronDown size={18} className={`transition-transform ${expandedSections.roast ? "" : "-rotate-90"}`} />
        </button>

        {expandedSections.roast && (
          <div className="space-y-3">
            {["Light", "Medium", "Dark"].map((level) => (
              <label key={level} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.roastLevel.includes(level)}
                  onChange={() => handleRoastChange(level)}
                  className="rounded border-border accent-accent"
                />
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-smooth">
                  {level}
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
          className="w-full flex justify-between items-center mb-4 font-semibold text-primary dark:text-secondary hover:text-accent transition-smooth"
        >
          Origin
          <ChevronDown size={18} className={`transition-transform ${expandedSections.origin ? "" : "-rotate-90"}`} />
        </button>

        {expandedSections.origin && (
          <div className="space-y-3">
            {["Ethiopia", "Colombia", "Brazil", "Kenya", "Indonesia", "Guatemala"].map((origin) => (
              <label key={origin} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.origin.includes(origin)}
                  onChange={() => handleOriginChange(origin)}
                  className="rounded border-border accent-accent"
                />
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-smooth">
                  {origin}
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
          className="w-full flex justify-between items-center mb-4 font-semibold text-primary dark:text-secondary hover:text-accent transition-smooth"
        >
          Price Range
          <ChevronDown size={18} className={`transition-transform ${expandedSections.price ? "" : "-rotate-90"}`} />
        </button>

        {expandedSections.price && (
          <div className="space-y-4">
            <input
              type="range"
              min="0"
              max="100"
              value={filters.priceRange[1]}
              onChange={(e) => {
                const newFilters = {
                  ...filters,
                  priceRange: [filters.priceRange[0], Number(e.target.value)],
                }
                setFilters(newFilters)
                onFilterChange(newFilters)
              }}
              className="w-full accent-accent"
            />
            <div className="text-sm text-muted-foreground">
              ${filters.priceRange[0]} - ${filters.priceRange[1]}
            </div>
          </div>
        )}
      </div>

      <button className="w-full mt-6 px-4 py-2 border border-border rounded-lg text-sm font-semibold hover:bg-accent/10 transition-smooth">
        Reset Filters
      </button>
    </aside>
  )
}
