"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale } from "next-intl";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import Newsletter from "@/components/home/newsletter";
import ProductCard from "@/components/products/product-card";
import ShopFilters from "@/components/ShopFilters";
import { getProducts, type ProductResponse, type PagedResult } from "@/lib/services/products";
import { useShopFilters } from "@/hooks/useShopFilters";
import { useCurrency } from "@/hooks/use-currency";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

export default function ProductsPage() {
  const t = useTranslations("products");
  const paginationT = useTranslations("pagination");
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
              value={filters.search || ""}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{ color: "#2b1b13", direction: isArabic ? "rtl" : "ltr", textAlign: isArabic ? "right" : "left" }}
            />
          </div>

          <div className={`flex flex-col ${isArabic ? "lg:flex-row-reverse" : "lg:flex-row"} gap-8`}>
            {/* LEFT SIDE: FILTERS */}
            <ShopFilters
              filters={filters}
              onSearchChange={setSearch}
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

            {/* RIGHT SIDE: PRODUCTS */}
            <div className="flex-1">
              {/* Top Bar: Results Info + Sort */}
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

                {/* Sort By Select */}
                <select
                  value={filters.sortBy || ""}
                  onChange={(e) => setSortBy(e.target.value || undefined)}
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

              {/* Error State */}
              {error && !loading && (
                <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 rounded">
                  {error}
                </div>
              )}

              {/* Loading State */}
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

              {/* Empty State */}
              {!loading && products.length === 0 && !error && (
                <div className="text-center py-12">
                  <p className="text-lg text-muted-foreground mb-4">{paginationT("noProductsFound")}</p>
                  <Button onClick={resetFilters} variant="outline">
                    {paginationT("resetFilters")}
                  </Button>
                </div>
              )}

              {/* Products Grid */}
              {!loading && products.length > 0 && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    {products.map((product, index) => (
                      <ProductCard key={product.id} product={product} priority={index < 3} />
                    ))}
                  </div>

                  {/* Pagination */}
                  {paginationData && paginationData.totalPages > 1 && (
                    <div className={`flex items-center justify-between ${isArabic ? "flex-row-reverse" : ""}`}>
                      <button
                        onClick={() => handlePageChange(filters.pageNumber - 1)}
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
                        onClick={() => handlePageChange(filters.pageNumber + 1)}
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
          </div>
        </div>
      </main>
      <Newsletter />
      <Footer />
    </>
  );
}