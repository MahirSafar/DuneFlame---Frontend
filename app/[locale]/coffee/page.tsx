"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useLocale } from "next-intl";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import Newsletter from "@/components/home/newsletter";
import ShopFilters from "@/components/ShopFilters";
import { getProducts, type ProductResponse, type PagedResult } from "@/lib/services/products";
import { useShopFilters } from "@/hooks/useShopFilters";
import { useCurrency } from "@/hooks/use-currency";
import { useTranslations } from "next-intl";
import { useDebounce } from "@/hooks/use-debounce";

const SearchResultsSection = dynamic(
  () => import("@/components/products/search-results-section"),
  { ssr: false }
);

export default function ProductsPage() {
  const t = useTranslations("products");
  const locale = useLocale();
  const isArabic = locale === "ar";
  const { currency } = useCurrency(); // Get current currency
  
  // 1. Hook-dan state və funksiyaları götürürük
  const {
    filters,
    setSearch,
    setCategoryId,
    setMinPrice,
    setMaxPrice,
    toggleRoastLevel,
    toggleOrigin,
    setSortBy,
    setPageNumber,
    resetFilters,
  } = useShopFilters();

  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [paginationData, setPaginationData] = useState<PagedResult<ProductResponse> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [minAvailablePrice, setMinAvailablePrice] = useState<number>(0);
  const [maxAvailablePrice, setMaxAvailablePrice] = useState<number>(500);
  const [searchInput, setSearchInput] = useState(filters.search || "");
  const debouncedSearchInput = useDebounce(searchInput, 400);

  useEffect(() => {
    if (debouncedSearchInput !== filters.search) {
      setSearch(debouncedSearchInput);
    }
  }, [debouncedSearchInput, filters.search, setSearch]);

  useEffect(() => {
    if (searchInput !== filters.search) {
      setSearchInput(filters.search || "");
    }
  }, [filters.search, searchInput]);

  // 2. Filterlər hər dəyişəndə API-yə sorğu göndəririk
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // CRITICAL: Pass filter state directly to getProducts
        const result = await getProducts({
          pageNumber: filters.pageNumber,
          pageSize: filters.pageSize,
          search: filters.search || undefined,
          categoryId: filters.categoryId || undefined,
          minPrice: filters.minPrice,
          maxPrice: filters.maxPrice,
          roastLevelIds: filters.roastLevelIds && filters.roastLevelIds.length > 0 ? filters.roastLevelIds : undefined,
          originIds: filters.originIds && filters.originIds.length > 0 ? filters.originIds : undefined,
          sortBy: filters.sortBy || undefined,
        });

        // Backend PagedResult qaytarır, ona görə result.items götürürük
        setProducts(result.items || []);
        setPaginationData(result);

        // Calculate min/max prices from fetched products, filtered by current currency
        if (result.items.length > 0) {
          const allPrices = result.items.flatMap(p => 
            p.availablePrices?.filter(ap => ap.currencyCode === currency)?.map(ap => ap.price) || []
          );
          if (allPrices.length > 0) {
            const min = Math.floor(Math.min(...allPrices));
            const max = Math.ceil(Math.max(...allPrices));
            setMinAvailablePrice(min);
            setMaxAvailablePrice(max);
          } else {
            // Fallback: try to get ALL prices regardless of currency
            const allPricesFallback = result.items.flatMap(p => 
              p.availablePrices?.map(ap => ap.price) || []
            );
            if (allPricesFallback.length > 0) {
              const min = Math.floor(Math.min(...allPricesFallback));
              const max = Math.ceil(Math.max(...allPricesFallback));
              setMinAvailablePrice(min);
              setMaxAvailablePrice(max);
            }
          }
        }
      } catch (err) {
        setError((err as any)?.message || "Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters, currency]); // Dependency: filters state changes or currency changes

  const handlePageChange = (newPageNumber: number) => {
    setPageNumber(newPageNumber);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background" dir={isArabic ? "rtl" : "ltr"}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="uppercase mb-2" style={{ color: "#2b1b13", fontSize: "24px", fontWeight: 700, textAlign: isArabic ? "right" : "left" }}>
              {t("pageTitle")}
            </h1>
            <p style={{ color: "#2b1b13", textAlign: isArabic ? "right" : "left" }}>
              {t("description")}
            </p>
          </div>

          {/* SEARCH BAR - Full Width */}
          <div className="mb-8">
            <input
              type="text"
              placeholder={t("searchPlaceholder")}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{ color: "#2b1b13", direction: isArabic ? "rtl" : "ltr", textAlign: isArabic ? "right" : "left" }}
            />
          </div>

          <div className={`flex flex-col ${isArabic ? "lg:flex-row-reverse" : "lg:flex-row"} gap-8`}>
            {/* LEFT SIDE: FILTERS */}
            <ShopFilters
              filters={filters}
              onSearchChange={setSearchInput}
              onCategoryChange={setCategoryId}
              onMinPriceChange={setMinPrice}
              onMaxPriceChange={setMaxPrice}
              onRoastLevelToggle={toggleRoastLevel}
              onOriginToggle={toggleOrigin}
              onSortByChange={setSortBy}
              onReset={resetFilters}
              minAvailablePrice={minAvailablePrice}
              maxAvailablePrice={maxAvailablePrice}
              currency={currency}
            />

            {/* RIGHT SIDE: RESULTS */}
            <SearchResultsSection
              isArabic={isArabic}
              loading={loading}
              error={error}
              products={products}
              paginationData={paginationData}
              filters={filters}
              onSortByChange={setSortBy}
              onResetFilters={resetFilters}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </main>
      <Newsletter />
      <Footer />
    </>
  );
}