"use client";

import { useEffect, useState, Suspense } from "react";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import Newsletter from "@/components/home/newsletter";
import ShopFilters from "@/components/ShopFilters";
import {
  getProducts,
  getCategoryBySlug,
  type ProductResponse,
  type PagedResult,
  type Category,
} from "@/lib/services/products";
import { useShopFilters } from "@/hooks/useShopFilters";
import { useCurrency } from "@/hooks/use-currency";
import { useDebounce } from "@/hooks/use-debounce";

const SearchResultsSection = dynamic(
  () => import("@/components/products/search-results-section"),
  { ssr: false }
);

function ShopPageInner() {
  const t = useTranslations("products");
  const locale = useLocale();
  const isArabic = locale === "ar";
  const { currency } = useCurrency();
  const searchParams = useSearchParams();

  // Category slug from URL (?category=coffee, ?category=brewing-equipment, etc.)
  const categorySlug = searchParams.get("category") || "";

  const {
    filters,
    setSearch,
    setCategoryId,
    setBrandId,
    setMinPrice,
    setMaxPrice,
    setColor,
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
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  // True while a categorySlug→GUID resolution is in-flight.
  // Prevents the fetch effect from firing with categoryId=undefined during that window.
  const [isCategoryResolving, setIsCategoryResolving] = useState(() => !!categorySlug);

  const debouncedSearchInput = useDebounce(searchInput, 400);

  // Resolve category slug → GUID, then set it in the filter
  useEffect(() => {
    if (!categorySlug) {
      setIsCategoryResolving(false);
      setActiveCategory(null);
      setCategoryId(undefined);
      return;
    }
    // Signal that we're waiting — block the fetch effect immediately
    setIsCategoryResolving(true);
    getCategoryBySlug(categorySlug).then((cat) => {
      if (cat?.id) {
        setActiveCategory(cat);
        setCategoryId(cat.id);
      } else {
        setActiveCategory(null);
        setCategoryId(undefined);
      }
      // Resolution complete — allow the fetch effect to proceed
      setIsCategoryResolving(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categorySlug]);

  useEffect(() => {
    if (debouncedSearchInput !== filters.search) {
      setSearch(debouncedSearchInput);
    }
  }, [debouncedSearchInput, filters.search, setSearch]);

  useEffect(() => {
    if (filters.search !== debouncedSearchInput) {
      setSearchInput(filters.search || "");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search]);

  useEffect(() => {
    // While slug→GUID resolution is in-flight, hold the loading spinner and skip the fetch.
    // This prevents the brief flash of all 74 products before the category GUID is known.
    if (isCategoryResolving) {
      setLoading(true);
      return;
    }
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getProducts({
          pageNumber: filters.pageNumber,
          pageSize: filters.pageSize,
          search: filters.search || undefined,
          categoryId: filters.categoryId || undefined,
          brandId: filters.brandId || undefined,
          minPrice: filters.minPrice,
          maxPrice: filters.maxPrice,
          color: filters.color || undefined,
          roastLevelIds:
            filters.roastLevelIds && filters.roastLevelIds.length > 0
              ? filters.roastLevelIds
              : undefined,
          originIds:
            filters.originIds && filters.originIds.length > 0
              ? filters.originIds
              : undefined,
          sortBy: filters.sortBy || undefined,
        });

        setProducts(result.items || []);
        setPaginationData(result);

        if (result.items.length > 0) {
          const allPrices = result.items.flatMap((p) => p.variants?.map((v) => v.price) || []);
          if (allPrices.length > 0) {
            setMinAvailablePrice(Math.floor(Math.min(...allPrices)));
            setMaxAvailablePrice(Math.ceil(Math.max(...allPrices)));
          }
        }
      } catch (err) {
        setError((err as Error)?.message || "Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters, currency, isCategoryResolving]);

  const handlePageChange = (newPage: number) => {
    setPageNumber(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Dynamic page title: prefer the resolved category name, fall back to slug, then generic
  const pageTitle = activeCategory?.name
    ? activeCategory.name
    : categorySlug
    ? categorySlug.replace(/-/g, " ")
    : t("pageTitle");

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background" dir={isArabic ? "rtl" : "ltr"}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1
              className="mb-2"
              style={{
                color: "#2b1b13",
                fontSize: "24px",
                fontWeight: 700,
                textTransform: "uppercase",
                textAlign: isArabic ? "right" : "left",
              }}
            >
              {pageTitle}
            </h1>
            <p style={{ color: "#2b1b13", textAlign: isArabic ? "right" : "left" }}>
              {t("description")}
            </p>
          </div>

          {/* Search Bar */}
          <div className="mb-8">
            <input
              type="text"
              placeholder={t("searchPlaceholder")}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{
                color: "#2b1b13",
                direction: isArabic ? "rtl" : "ltr",
                textAlign: isArabic ? "right" : "left",
              }}
            />
          </div>

          <div
            className={`flex flex-col ${isArabic ? "lg:flex-row-reverse" : "lg:flex-row"} gap-8`}
          >
            {/* Filters */}
            <ShopFilters
              filters={filters}
              onSearchChange={setSearchInput}
              onCategoryChange={setCategoryId}
              onBrandChange={setBrandId}
              onMinPriceChange={setMinPrice}
              onMaxPriceChange={setMaxPrice}
              onColorChange={setColor}
              onRoastLevelToggle={toggleRoastLevel}
              onOriginToggle={toggleOrigin}
              onSortByChange={setSortBy}
              onReset={resetFilters}
              minAvailablePrice={minAvailablePrice}
              maxAvailablePrice={maxAvailablePrice}
              currency={currency}
            />

            {/* Results */}
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

export default function ShopPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading…</div>
      </div>
    }>
      <ShopPageInner />
    </Suspense>
  );
}
