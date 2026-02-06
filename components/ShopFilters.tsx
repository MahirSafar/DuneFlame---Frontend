"use client";

// Price Range Slider Styles
const rubberBandStyles = `
  .rubber-ipt {
    width: 100%;
    height: 2px;
    background-color: #e5e7eb;
    position: relative;
    margin: 30px 0 20px 0;
  }

  .rubber-ipt-range {
    height: 2px;
    background-color: #2b1b13;
    position: absolute;
    top: 0;
  }

  .rubber-ipt-min,
  .rubber-ipt-max {
    height: 16px;
    width: 16px;
    border-radius: 50%;
    position: absolute;
    background-color: white;
    border: 2px solid #2b1b13;
    top: -7px;
    cursor: grab;
  }

  .rubber-ipt-min:active,
  .rubber-ipt-max:active {
    cursor: grabbing;
  }

  .rubber-ipt-min {
    left: 0;
  }

  .rubber-ipt-max {
    right: 0;
  }

  .rubber-value-min,
  .rubber-value-max {
    font-size: 12px;
    font-weight: 600;
    color: #2b1b13;
    margin-top: 8px;
  }
`;

import { useEffect, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { getCategories, getRoastLevels, getOrigins, type Category, type Origin, type RoastLevel } from "@/lib/services/products";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { ShopFiltersState } from "@/hooks/useShopFilters";
import { getCurrencySymbol, type CurrencyType } from "@/lib/currency-utils";

interface ShopFiltersProps {
  filters: ShopFiltersState;
  onSearchChange: (search: string) => void;
  onCategoryChange: (categoryId: string | undefined) => void;
  onMinPriceChange: (minPrice: number | undefined) => void;
  onMaxPriceChange: (maxPrice: number | undefined) => void;
  onRoastLevelToggle: (id: string) => void;
  onOriginToggle: (id: string) => void;
  onSortByChange: (sortBy: string | undefined) => void;
  onReset: () => void;
  minAvailablePrice?: number;
  maxAvailablePrice?: number;
  currency?: CurrencyType;
}

export default function ShopFilters({
  filters,
  onSearchChange,
  onCategoryChange,
  onMinPriceChange,
  onMaxPriceChange,
  onRoastLevelToggle,
  onOriginToggle,
  onSortByChange,
  onReset,
  minAvailablePrice = 0,
  maxAvailablePrice = 10000,
  currency = "AED" as CurrencyType,
}: ShopFiltersProps) {
  const t = useTranslations();
  const currencySymbol = getCurrencySymbol(currency);

  const [categories, setCategories] = useState<Category[]>([]);
  const [roastLevels, setRoastLevels] = useState<RoastLevel[]>([]);
  const [origins, setOrigins] = useState<Origin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [expandedSections, setExpandedSections] = useState({
    search: false,
    category: false,
    roast: false,
    origin: false,
    price: false,
    sort: false,
  });

  // 🔍 DEBUG: Log filters state changes
  useEffect(() => {
    console.log("[ShopFilters] Current filters state:", {
      roastLevelIds: filters.roastLevelIds,
      originIds: filters.originIds,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      sortBy: filters.sortBy,
    });
  }, [filters]);

  // Fetch master data on mount
  useEffect(() => {
    console.log("[ShopFilters] 🚀 Starting to fetch master data...");

    Promise.all([getCategories(), getRoastLevels(), getOrigins()])
      .then(([cats, roasts, orgs]) => {
        console.log("[ShopFilters] ✅ Master data loaded:", {
          categories: cats.length,
          roastLevels: roasts.length,
          origins: orgs.length,
          roastLevelDetails: roasts,
          originDetails: orgs,
        });

        setCategories(cats);
        setRoastLevels(roasts);
        setOrigins(orgs);
        setError(null);
      })
      .catch((err) => {
        console.error("[ShopFilters] ❌ Failed to load filter data:", err);
        setError("Failed to load filter options");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      search: false,
      category: false,
      roast: false,
      origin: false,
      price: false,
      sort: false,
      [section]: !prev[section],
    }));
  };

  const handleRoastLevelChange = (id: string, checked: boolean) => {
    console.log("[ShopFilters] 🔘 Roast Level checkbox changed:", {
      id,
      checked,
      currentRoastLevelIds: filters.roastLevelIds,
    });
    onRoastLevelToggle(id);
  };

  const handleOriginChange = (id: string, checked: boolean) => {
    console.log("[ShopFilters] 🔘 Origin checkbox changed:", {
      id,
      checked,
      currentOriginIds: filters.originIds,
    });
    onOriginToggle(id);
  };

  const handleCategoryChange = (id: string, checked: boolean) => {
    console.log("[ShopFilters] 🔘 Category checkbox changed:", {
      id,
      checked,
      currentCategoryId: filters.categoryId,
    });
    onCategoryChange(checked ? id : undefined);
  };

  // Update price display when currency changes
  useEffect(() => {
    const minPriceEl = document.getElementById("rubber-value-min");
    const maxPriceEl = document.getElementById("rubber-value-max");
    if (minPriceEl && maxPriceEl) {
      minPriceEl.textContent = `${currencySymbol}${Math.round(minAvailablePrice)}`;
      maxPriceEl.textContent = `${currencySymbol}${Math.round(maxAvailablePrice)}`;
    }
  }, [currencySymbol, minAvailablePrice, maxAvailablePrice]);

  // Rubber band price range slider
  useEffect(() => {
    if (!expandedSections.price) return;

    const container = document.getElementById("rubber-ipt-container");
    if (!container) return;

    const rubberRange = document.getElementById("rubber-ipt-range");
    const rubberMin = document.getElementById("rubber-ipt-min");
    const rubberMax = document.getElementById("rubber-ipt-max");
    const minPriceEl = document.getElementById("rubber-value-min");
    const maxPriceEl = document.getElementById("rubber-value-max");

    if (!rubberRange || !rubberMin || !rubberMax || !minPriceEl || !maxPriceEl) return;

    const containerWidth = container.offsetWidth;
    const priceRange = maxAvailablePrice - minAvailablePrice;

    // Initialize with product min/max
    let currentMinPos = 0;
    let currentMaxPos = containerWidth;

    rubberMin.style.left = `${currentMinPos}px`;
    rubberMax.style.left = `${currentMaxPos}px`;
    minPriceEl.textContent = `${currencySymbol}${Math.round(minAvailablePrice)}`;
    maxPriceEl.textContent = `${currencySymbol}${Math.round(maxAvailablePrice)}`;

    const updateRange = () => {
      rubberRange.style.left = `${currentMinPos}px`;
      rubberRange.style.width = `${currentMaxPos - currentMinPos}px`;
    };

    // Min drag handler
    const handleMinMouseDown = (e: MouseEvent) => {
      const startX = e.clientX;
      const startPos = currentMinPos;

      const handleMinMouseMove = (moveEvent: MouseEvent) => {
        const diff = moveEvent.clientX - startX;
        let newPos = startPos + diff;

        newPos = Math.max(0, Math.min(newPos, currentMaxPos - 10));
        currentMinPos = newPos;
        rubberMin.style.left = `${newPos}px`;

        const calculatedPrice = minAvailablePrice + (newPos / containerWidth) * priceRange;
        const roundedPrice = Math.round(calculatedPrice);
        minPriceEl.textContent = `${currencySymbol}${roundedPrice}`;
        onMinPriceChange(roundedPrice);
        updateRange();
      };

      const handleMinMouseUp = () => {
        document.removeEventListener("mousemove", handleMinMouseMove);
        document.removeEventListener("mouseup", handleMinMouseUp);
      };

      document.addEventListener("mousemove", handleMinMouseMove);
      document.addEventListener("mouseup", handleMinMouseUp);
    };

    // Max drag handler
    const handleMaxMouseDown = (e: MouseEvent) => {
      const startX = e.clientX;
      const startPos = currentMaxPos;

      const handleMaxMouseMove = (moveEvent: MouseEvent) => {
        const diff = moveEvent.clientX - startX;
        let newPos = startPos + diff;

        newPos = Math.max(currentMinPos + 10, Math.min(newPos, containerWidth));
        currentMaxPos = newPos;
        rubberMax.style.left = `${newPos}px`;

        const calculatedPrice = minAvailablePrice + (newPos / containerWidth) * priceRange;
        const roundedPrice = Math.round(calculatedPrice);
        maxPriceEl.textContent = `${currencySymbol}${roundedPrice}`;
        onMaxPriceChange(roundedPrice);
        updateRange();
      };

      const handleMaxMouseUp = () => {
        document.removeEventListener("mousemove", handleMaxMouseMove);
        document.removeEventListener("mouseup", handleMaxMouseUp);
      };

      document.addEventListener("mousemove", handleMaxMouseMove);
      document.addEventListener("mouseup", handleMaxMouseUp);
    };

    rubberMin.addEventListener("mousedown", handleMinMouseDown);
    rubberMax.addEventListener("mousedown", handleMaxMouseDown);
    updateRange();

    return () => {
      rubberMin.removeEventListener("mousedown", handleMinMouseDown);
      rubberMax.removeEventListener("mousedown", handleMaxMouseDown);
    };
  }, [expandedSections.price, minAvailablePrice, maxAvailablePrice, currencySymbol]);

  if (loading) {
    return (
      <>
        <style>{rubberBandStyles}</style>
        <aside className="glass rounded-xl p-6 h-fit lg:sticky lg:top-24 w-full lg:w-80">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-3/4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded"></div>
          </div>
        </div>
      </aside>
      </>
    );
  }

  const hasActiveFilters =
    filters.search ||
    filters.categoryId ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.roastLevelIds.length > 0 ||
    filters.originIds.length > 0 ||
    filters.sortBy;

  return (
    <>
      <style>{rubberBandStyles}</style>
      <aside className="glass rounded-xl p-6 h-fit lg:sticky lg:top-24 w-full lg:w-80">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold uppercase" style={{ color: "#2b1b13" }}>
            {t("products.filters.title")}
          </h2>
          <button
            onClick={onReset}
            className="text-xs font-semibold uppercase text-accent hover:text-accent/80 transition-colors"
            title={t("products.filters.resetFilters")}
          >
            {t("products.filters.reset")}
          </button>
        </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 rounded text-sm">
          {error}
        </div>
      )}

      {/* FILTERS SECTION */}

      {/* Roast Level Checkboxes */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection("roast")}
          className="w-full flex justify-between items-center mb-3 text-sm font-semibold transition-smooth uppercase"
          style={{ color: "#2b1b13" }}
        >
          {t("products.filters.roastLevel")} ({roastLevels.length})
          <ChevronDown
            size={18}
            className={`transition-transform rtl:rotate-180 ${
              expandedSections.roast ? "" : "-rotate-90"
            }`}
          />
        </button>

        {expandedSections.roast && (
          <div className="space-y-3">
            {roastLevels.length === 0 ? (
              <p className="text-sm text-muted-foreground">No roast levels available</p>
            ) : (
              roastLevels.map((level) => {
                const isChecked = filters.roastLevelIds.includes(level.id);
                return (
                  <div key={level.id} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id={`roast-${level.id}`}
                      checked={isChecked}
                      onChange={(e) => handleRoastLevelChange(level.id, e.target.checked)}
                      className="w-5 h-5 rounded border-2 border-border cursor-pointer accent-accent hover:border-accent transition-colors"
                    />
                    <label
                      htmlFor={`roast-${level.id}`}
                      className="text-sm cursor-pointer flex-1"
                      style={{ color: "#2b1b13" }}
                    >
                      {level.name}
                    </label>
                    {isChecked && <span className="text-xs text-accent">✓</span>}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Origin Checkboxes */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection("origin")}
          className="w-full flex justify-between items-center mb-3 text-sm font-semibold transition-smooth uppercase"
          style={{ color: "#2b1b13" }}
        >
          {t("products.filters.origin")} ({origins.length})
          <ChevronDown
            size={18}
            className={`transition-transform rtl:rotate-180 ${
              expandedSections.origin ? "" : "-rotate-90"
            }`}
          />
        </button>

        {expandedSections.origin && (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {origins.length === 0 ? (
              <p className="text-sm text-muted-foreground">No origins available</p>
            ) : (
              origins.map((origin) => {
                const isChecked = filters.originIds.includes(origin.id);
                return (
                  <div key={origin.id} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id={`origin-${origin.id}`}
                      checked={isChecked}
                      onChange={(e) => handleOriginChange(origin.id, e.target.checked)}
                      className="w-5 h-5 rounded border-2 border-border cursor-pointer accent-accent hover:border-accent transition-colors"
                    />
                    <label
                      htmlFor={`origin-${origin.id}`}
                      className="text-sm cursor-pointer flex-1"
                      style={{ color: "#2b1b13" }}
                    >
                      {origin.name}
                    </label>
                    {isChecked && <span className="text-xs text-accent">✓</span>}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Category Checkboxes */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection("category")}
          className="w-full flex justify-between items-center mb-3 text-sm font-semibold transition-smooth uppercase"
          style={{ color: "#2b1b13" }}
        >
          {t("products.filters.category")} ({categories.length})
          <ChevronDown
            size={18}
            className={`transition-transform rtl:rotate-180 ${
              expandedSections.category ? "" : "-rotate-90"
            }`}
          />
        </button>

        {expandedSections.category && (
          <div className="space-y-3">
            {categories.length === 0 ? (
              <p className="text-sm text-muted-foreground">No categories available</p>
            ) : (
              categories.map((category) => {
                const isChecked = filters.categoryId === category.id;
                return (
                  <div
                    key={category.id}
                    className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <input
                      type="checkbox"
                      id={`category-${category.id}`}
                      checked={isChecked}
                      onChange={(e) => {
                        handleCategoryChange(category.id, e.target.checked);
                      }}
                      className="w-5 h-5 rounded border-2 border-border cursor-pointer accent-accent hover:border-accent transition-colors"
                    />
                    <label
                      htmlFor={`category-${category.id}`}
                      className="text-sm cursor-pointer flex-1"
                      style={{ color: "#2b1b13" }}
                    >
                      {category.name}
                    </label>
                    {isChecked && <span className="text-xs text-accent">✓</span>}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Price Range */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection("price")}
          className="w-full flex justify-between items-center mb-3 text-sm font-semibold transition-smooth uppercase"
          style={{ color: "#2b1b13" }}
        >
          Price Range
          <ChevronDown
            size={18}
            className={`transition-transform rtl:rotate-180 ${
              expandedSections.price ? "" : "-rotate-90"
            }`}
          />
        </button>

        {expandedSections.price && (
          <div className="space-y-2">
            <div className="rubber-ipt" id="rubber-ipt-container">
              <div className="rubber-ipt-range" id="rubber-ipt-range"></div>
              <div className="rubber-ipt-min" id="rubber-ipt-min"></div>
              <div className="rubber-ipt-max" id="rubber-ipt-max"></div>
            </div>
            <div className="w-full flex justify-between items-center">
              <p className="rubber-value-min" id="rubber-value-min">{currencySymbol}{minAvailablePrice}</p>
              <p className="rubber-value-max" id="rubber-value-max">{currencySymbol}{maxAvailablePrice}</p>
            </div>
          </div>
        )}
      </div>
    </aside>
    </>
  );
}
