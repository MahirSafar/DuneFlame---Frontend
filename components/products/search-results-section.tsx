"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
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
            <div key={i} className="animate-pulse">
              <div className="aspect-square bg-muted rounded-xl mb-4"></div>
              <div className="h-4 bg-muted rounded mb-2"></div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </div>
          ))}
        </div>
      )}

      {!loading && products.length === 0 && !error && (
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground mb-4">{paginationT("noProductsFound")}</p>
          <Button onClick={onResetFilters} variant="outline">
            {paginationT("resetFilters")}
          </Button>
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
