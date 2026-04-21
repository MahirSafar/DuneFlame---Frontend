"use client";

import { ChevronLeft, ChevronRight, SearchX } from "lucide-react";
import { useTranslations } from "next-intl";
import ProductCard from "@/components/products/product-card";
import { Button } from "@/components/ui/button";
import type { ProductResponse, PagedResult } from "@/lib/services/products";
import type { ShopFiltersState } from "@/hooks/useShopFilters";

interface SearchResultsSectionProps {
  isArabic: boolean;
  loading: boolean;
  error: string | null;
  products: ProductResponse[];
  paginationData: PagedResult<ProductResponse> | null;
  filters: ShopFiltersState;
  onSortByChange: (sortBy: string | undefined) => void;
  onResetFilters: () => void;
  onPageChange: (newPageNumber: number) => void;
}

export default function SearchResultsSection({
  isArabic,
  loading,
  error,
  products,
  paginationData,
  filters,
  onSortByChange,
  onResetFilters,
  onPageChange,
}: SearchResultsSectionProps) {
  const t = useTranslations("products");
  const paginationT = useTranslations("pagination");

  return (
    <div className="flex-1">
      <div className={`mb-6 flex flex-col sm:flex-row items-start sm:items-center ${isArabic ? "sm:flex-row-reverse" : ""} justify-between gap-4`}>
        <p className="text-sm text-muted-foreground" style={{ textAlign: isArabic ? "right" : "left" }}>
          {loading ? (
            t("loading")
          ) : products.length === 0 ? (
            t("noProducts")
          ) : (
            <>
              {t("showing")} <span className="font-semibold">{products.length}</span> {t("of")}{" "}
              <span className="font-semibold">{paginationData?.totalCount || 0}</span> {t("products")}
            </>
          )}
        </p>

        <select
          value={filters.sortBy || ""}
          onChange={(e) => onSortByChange(e.target.value || undefined)}
          className="px-4 py-2.5 rounded-lg border-2 border-border bg-white text-foreground text-sm font-semibold hover:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all cursor-pointer uppercase"
          style={{
            color: "#2b1b13",
            direction: isArabic ? "rtl" : "ltr",
          }}
        >
          <option value="" style={{ color: "#2b1b13", backgroundColor: "white", padding: "8px" }}>{t("sortByDefault")}</option>
          <option value="price-asc" style={{ color: "#2b1b13", backgroundColor: "white", padding: "8px" }}>{t("filters.priceLowToHigh")}</option>
          <option value="price-desc" style={{ color: "#2b1b13", backgroundColor: "white", padding: "8px" }}>{t("filters.priceHighToLow")}</option>
          <option value="name-asc" style={{ color: "#2b1b13", backgroundColor: "white", padding: "8px" }}>{t("filters.nameAtoZ")}</option>
          <option value="name-desc" style={{ color: "#2b1b13", backgroundColor: "white", padding: "8px" }}>{t("filters.nameZtoA")}</option>
        </select>
      </div>

      {error && !loading && (
        <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 rounded">
          {error}
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="glass rounded-xl overflow-hidden animate-pulse flex flex-col">
              {/* Image placeholder */}
              <div className="h-64 bg-muted rounded-t-xl shrink-0" />
              {/* Content placeholder */}
              <div className="p-4 flex flex-col flex-1 space-y-3">
                <div className="h-3 bg-muted rounded w-1/3" />
                <div className="h-5 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-full" />
                <div className="mt-auto pt-3 h-6 bg-muted rounded w-2/5" />
              </div>
              <div className="px-4 pb-4">
                <div className="h-3 bg-muted rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && products.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <div className="mb-6 flex items-center justify-center w-24 h-24 rounded-full bg-muted/60">
            <SearchX size={40} className="text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold uppercase mb-2" style={{ color: '#2b1b13' }}>
            {paginationT("noProductsFound")}
          </h3>
          <p className="text-muted-foreground mb-8 max-w-sm">
            No products match your current filters. Try adjusting your search or removing some filters.
          </p>
          <button
            onClick={onResetFilters}
            style={{
              backgroundColor: '#2b1b13',
              color: '#fff',
              borderRadius: '0.75rem',
              padding: '0.875rem 2.5rem',
              fontSize: '1rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseOver={e => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = '#1a0f09')}
            onMouseOut={e => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = '#2b1b13')}
          >
            {paginationT("resetFilters")}
          </button>
        </div>
      )}

      {!loading && products.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {products.map((product, index) => (
              <ProductCard key={product.id} product={product} priority={index < 3} />
            ))}
          </div>

          {paginationData && paginationData.totalPages > 1 && (
            <div className={`flex items-center justify-between ${isArabic ? "flex-row-reverse" : ""}`}>
              <button
                onClick={() => onPageChange(filters.pageNumber - 1)}
                disabled={filters.pageNumber === 1}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed ${isArabic ? "flex-row-reverse" : ""}`}
              >
                {isArabic ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                {paginationT("previous")}
              </button>

              <span className="text-sm text-muted-foreground">
                {paginationT("page")} {filters.pageNumber} {paginationT("of")} {paginationData.totalPages}
              </span>

              <button
                onClick={() => onPageChange(filters.pageNumber + 1)}
                disabled={filters.pageNumber === paginationData.totalPages}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed ${isArabic ? "flex-row-reverse" : ""}`}
              >
                {paginationT("next")}
                {isArabic ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
