"use client";

import React, { useEffect, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { useLocale } from "next-intl";
import { getCategoryTree, getRoastLevels, getOrigins, getMasterData, type CategoryTreeNode, type Origin, type RoastLevel } from "@/lib/services/products";
import { type MasterData } from "@/lib/types";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { ShopFiltersState } from "@/hooks/useShopFilters";
import { getCurrencySymbol, type CurrencyType } from "@/lib/currency-utils";

interface ShopFiltersProps {
  filters: ShopFiltersState;
  onSearchChange: (search: string) => void;
  onCategoryChange: (categoryId: string | undefined) => void;
  onBrandChange: (brandId: string | undefined) => void;
  onMinPriceChange: (minPrice: number | undefined) => void;
  onMaxPriceChange: (maxPrice: number | undefined) => void;
  onRoastLevelToggle: (id: string) => void;
  onOriginToggle: (id: string) => void;
  onSortByChange: (sortBy: string | undefined) => void;
  onColorChange: (color: string | undefined) => void;
  onReset: () => void;
  minAvailablePrice?: number;
  maxAvailablePrice?: number;
  currency?: CurrencyType;
}

export default function ShopFilters({
  filters,
  onSearchChange,
  onCategoryChange,
  onBrandChange,
  onMinPriceChange,
  onMaxPriceChange,
  onRoastLevelToggle,
  onOriginToggle,
  onSortByChange,
  onColorChange,
  onReset,
  minAvailablePrice = 0,
  maxAvailablePrice = 10000,
  currency = "AED" as CurrencyType,
}: ShopFiltersProps) {
  const t = useTranslations();
  const locale = useLocale();
  const isArabic = locale === "ar";
  const currencySymbol = getCurrencySymbol(currency);

  const [categoryTree, setCategoryTree] = useState<CategoryTreeNode[]>([]);
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Set<string>>(new Set());
  const [brands, setBrands] = useState<MasterData["brands"]>([]);
  const [roastLevels, setRoastLevels] = useState<RoastLevel[]>([]);
  const [origins, setOrigins] = useState<Origin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [expandedSections, setExpandedSections] = useState({
    search: false,
    category: false,
    brand: false,
    roast: false,
    origin: false,
    price: false,
    sort: false,
    color: false,
  });

  // Controlled state for price number inputs
  const [localMin, setLocalMin] = useState<string>(
    filters.minPrice != null ? String(filters.minPrice) : ""
  );
  const [localMax, setLocalMax] = useState<string>(
    filters.maxPrice != null ? String(filters.maxPrice) : ""
  );

  // Sync price inputs when filters are reset externally
  useEffect(() => {
    if (filters.minPrice == null) setLocalMin("");
    if (filters.maxPrice == null) setLocalMax("");
  }, [filters.minPrice, filters.maxPrice]);

  // 🔍 DEBUG: Log filters state changes
  useEffect(() => {
  }, [filters]);

  // Fetch master data on mount
  useEffect(() => {

    Promise.all([getCategoryTree().catch(() => [] as CategoryTreeNode[]), getRoastLevels(), getOrigins(), getMasterData()])
      .then(([tree, roasts, orgs, mData]) => {

        setCategoryTree(tree);
        setRoastLevels(roasts);
        setOrigins(orgs);
        setBrands(mData.brands || []);
        setError(null);
      })
      .catch((err) => {
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
      brand: false,
      roast: false,
      origin: false,
      price: false,
      sort: false,
      color: false,
      [section]: !prev[section],
    }));
  };

  const handleRoastLevelChange = (id: string, checked: boolean) => {
    onRoastLevelToggle(id);
  };

  const handleOriginChange = (id: string, checked: boolean) => {
    onOriginToggle(id);
  };

  const handleCategoryChange = (id: string, checked: boolean) => {
    onCategoryChange(checked ? id : undefined);
  };

  const handleBrandChange = (id: string, checked: boolean) => {
    onBrandChange(checked ? id : undefined);
  };

  // ── Category tree helpers ─────────────────────────────────────────────────

  const toggleCategoryExpand = (id: string) => {
    setExpandedCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const findInTree = (nodes: CategoryTreeNode[], id: string): CategoryTreeNode | undefined => {
    for (const n of nodes) {
      if (n.id === id) return n;
      const found = findInTree(n.children, id);
      if (found) return found;
    }
    return undefined;
  };

  const countTreeNodes = (nodes: CategoryTreeNode[], depth = 0): number =>
    nodes.reduce((acc, n) => {
      if (depth === 0 && n.name.toLowerCase() === "root") {
        return acc + countTreeNodes(n.children, 1);
      }
      return acc + 1 + countTreeNodes(n.children, depth + 1);
    }, 0);

  const selectedCategoryNode = filters.categoryId ? findInTree(categoryTree, filters.categoryId) : undefined;
  const isCoffeeCategory = selectedCategoryNode ? selectedCategoryNode.isCoffeeCategory === true : null;
  const isEquipmentCategory = selectedCategoryNode ? !isCoffeeCategory : null;

  const renderCategoryNode = (node: CategoryTreeNode, depth: number): React.ReactNode => {
    // Skip transparent "root" wrapper — render its children as top-level nodes
    if (depth === 0 && node.name.toLowerCase() === "root") {
      return (
        <React.Fragment key={node.id}>
          {node.children.map((child) => renderCategoryNode(child, 0))}
        </React.Fragment>
      );
    }
    const isChecked = filters.categoryId === node.id;
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedCategoryIds.has(node.id);
    return (
      <div key={node.id}>
        <div
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity py-0.5"
          style={{ paddingLeft: `${depth * 12}px` }}
        >
          {hasChildren ? (
            <button
              type="button"
              onClick={() => toggleCategoryExpand(node.id)}
              className="w-4 h-4 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors shrink-0"
              aria-label={isExpanded ? "Collapse" : "Expand"}
            >
              <ChevronDown size={12} className={`transition-transform ${isExpanded ? "" : "-rotate-90"}`} />
            </button>
          ) : (
            <span className="w-4 shrink-0" />
          )}
          <input
            type="checkbox"
            id={`category-${node.id}`}
            checked={isChecked}
            onChange={(e) => handleCategoryChange(node.id, e.target.checked)}
            className="w-4 h-4 rounded border-2 border-border cursor-pointer accent-accent hover:border-accent transition-colors shrink-0"
          />
          <label
            htmlFor={`category-${node.id}`}
            className={`text-sm cursor-pointer flex-1 ${hasChildren ? "font-semibold" : ""}`}
            style={{ color: "#2b1b13" }}
          >
            {node.name}
          </label>
          {isChecked && <span className="text-xs text-accent">✓</span>}
        </div>
        {hasChildren && isExpanded && (
          <div>{node.children.map((child) => renderCategoryNode(child, depth + 1))}</div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
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
    );
  }

  const hasActiveFilters =
    filters.search ||
    filters.categoryId ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.color ||
    filters.roastLevelIds.length > 0 ||
    filters.originIds.length > 0 ||
    filters.sortBy;

  return (
    <aside className="glass rounded-xl p-6 h-fit lg:sticky lg:top-24 w-full lg:w-80" dir={isArabic ? "rtl" : "ltr"}>
        <div className={`flex items-center justify-between mb-6 ${isArabic ? "flex-row-reverse" : ""}`}>
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
      {isEquipmentCategory !== true && (
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
      )}

      {/* Origin Checkboxes */}
      {isEquipmentCategory !== true && (
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
      )}

      {/* Brand */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection("brand")}
          className="w-full flex justify-between items-center mb-3 text-sm font-semibold transition-smooth uppercase"
          style={{ color: "#2b1b13" }}
        >
          Brand
          <ChevronDown
            size={18}
            className={`transition-transform rtl:rotate-180 ${
              expandedSections.brand ? "" : "-rotate-90"
            }`}
          />
        </button>

        {expandedSections.brand && (
          <div className="space-y-3 pl-2">
            {brands.length === 0 && !loading ? (
              <p className="text-sm text-muted-foreground italic">
                No brands found
              </p>
            ) : (
              brands.map((brand) => {
                const isChecked = filters.brandId === brand.id;
                return (
                  <div
                    key={brand.id}
                    className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <input
                      type="checkbox"
                      id={`brand-${brand.id}`}
                      checked={isChecked}
                      onChange={(e) => {
                        handleBrandChange(brand.id, e.target.checked);
                      }}
                      className="w-5 h-5 rounded border-2 border-border cursor-pointer accent-accent hover:border-accent transition-colors"
                    />
                    <label
                      htmlFor={`brand-${brand.id}`}
                      className="text-sm cursor-pointer flex-1"
                      style={{ color: "#2b1b13" }}
                    >
                      {brand.name}
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
          {t("products.filters.priceRange")}
          <ChevronDown
            size={18}
            className={`transition-transform rtl:rotate-180 ${
              expandedSections.price ? "" : "-rotate-90"
            }`}
          />
        </button>

        {expandedSections.price && (
          <div className="space-y-3">
            <div className="flex gap-2 items-center">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">Min</p>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold pointer-events-none" style={{ color: '#2b1b13' }}>{currencySymbol}</span>
                  <input
                    type="number"
                    min={0}
                    value={localMin}
                    onChange={(e) => {
                      setLocalMin(e.target.value);
                      onMinPriceChange(e.target.value !== "" ? Number(e.target.value) : undefined);
                    }}
                    placeholder={String(Math.round(minAvailablePrice))}
                    className="w-full pl-7 pr-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                    style={{ color: '#2b1b13' }}
                  />
                </div>
              </div>
              <span className="text-muted-foreground mt-5 shrink-0">—</span>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">Max</p>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold pointer-events-none" style={{ color: '#2b1b13' }}>{currencySymbol}</span>
                  <input
                    type="number"
                    min={0}
                    value={localMax}
                    onChange={(e) => {
                      setLocalMax(e.target.value);
                      onMaxPriceChange(e.target.value !== "" ? Number(e.target.value) : undefined);
                    }}
                    placeholder={String(Math.round(maxAvailablePrice))}
                    className="w-full pl-7 pr-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                    style={{ color: '#2b1b13' }}
                  />
                </div>
              </div>
            </div>
            {(localMin !== "" || localMax !== "") && (
              <button
                onClick={() => {
                  setLocalMin("");
                  setLocalMax("");
                  onMinPriceChange(undefined);
                  onMaxPriceChange(undefined);
                }}
                className="text-xs text-accent hover:text-accent/70 transition-colors"
              >
                Clear price range
              </button>
            )}
          </div>
        )}
      </div>

      {/* Color Filter — Equipment only */}
      {isEquipmentCategory === true && (
        <div className="mb-6">
          <button
            onClick={() => toggleSection("color")}
            className="w-full flex justify-between items-center mb-3 text-sm font-semibold transition-smooth uppercase"
            style={{ color: "#2b1b13" }}
          >
            Color
            <ChevronDown
              size={18}
              className={`transition-transform rtl:rotate-180 ${
                expandedSections.color ? "" : "-rotate-90"
              }`}
            />
          </button>

          {expandedSections.color && (
            <div className="flex flex-col space-y-2">
              {[
                { label: "Black",       hex: "#1a1a1a" },
                { label: "Silver",      hex: "#C0C0C0" },
                { label: "White",       hex: "#F5F5F5" },
                { label: "Rose Gold",   hex: "#B76E79" },
                { label: "Chrome",      hex: "#A8A9AD" },
                { label: "Matte Black", hex: "#28282B" },
              ].map(({ label, hex }) => {
                const isSelected = filters.color === label;
                return (
                  <button
                    key={label}
                    onClick={() => onColorChange(isSelected ? undefined : label)}
                    title={label}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-semibold transition-all w-full text-left ${
                      isSelected
                        ? "border-espresso-brown bg-espresso-brown/10"
                        : "border-white/20 hover:border-espresso-brown/50"
                    }`}
                    style={{ color: '#2b1b13' }}
                  >
                    <span
                      className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                      style={{ backgroundColor: hex }}
                    />
                    {label}
                    {isSelected && <span className="ml-auto text-xs text-accent">✓</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
