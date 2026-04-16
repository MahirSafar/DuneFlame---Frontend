import { useState, useCallback, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

export interface ShopFiltersState {
  pageNumber: number;
  pageSize: number;
  search: string;
  categoryId?: string;
  brandId?: string;
  minPrice?: number;
  maxPrice?: number;
  roastLevelIds: string[];
  originIds: string[];
  sortBy?: string;
}

export interface UseShopFiltersReturn {
  filters: ShopFiltersState;
  setSearch: (search: string) => void;
  setCategoryId: (categoryId: string | undefined) => void;
  setBrandId: (brandId: string | undefined) => void;
  setMinPrice: (minPrice: number | undefined) => void;
  setMaxPrice: (maxPrice: number | undefined) => void;
  setSortBy: (sortBy: string | undefined) => void;
  toggleRoastLevel: (id: string) => void;
  toggleOrigin: (id: string) => void;
  setPageNumber: (pageNumber: number) => void;
  resetFilters: () => void;
}

const DEFAULT_FILTERS: ShopFiltersState = {
  pageNumber: 1,
  pageSize: 12,
  search: "",
  minPrice: undefined,
  maxPrice: undefined,
  roastLevelIds: [],
  originIds: [],
};

export function useShopFilters(): UseShopFiltersReturn {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<ShopFiltersState>(() => {
    // Initial state from URL
    const brandId = searchParams.get("brandId") || undefined;
    const search = searchParams.get("search") || "";
    return { ...DEFAULT_FILTERS, brandId, search };
  });

  // Sync URL when brandId or search changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (filters.brandId) {
      params.set("brandId", filters.brandId);
    } else {
      params.delete("brandId");
    }

    if (filters.search) {
      params.set("search", filters.search);
    } else {
      params.delete("search");
    }
    
    // Only push if the string actually changed
    const currentBrandId = searchParams.get("brandId");
    const currentSearch = searchParams.get("search") || "";
    const newBrandId = filters.brandId || null;
    const newSearch = filters.search || "";
    
    if (currentBrandId !== newBrandId || currentSearch !== newSearch) {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [filters.brandId, filters.search, pathname, router, searchParams]);

  // Helper to reset pageNumber to 1 when filters change
  const resetPageNumber = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      pageNumber: 1,
    }));
  }, []);

  const setSearch = useCallback((search: string) => {
    setFilters((prev) => ({
      ...prev,
      search,
      pageNumber: 1,
    }));
  }, []);

  const setCategoryId = useCallback((categoryId: string | undefined) => {
    setFilters((prev) => ({
      ...prev,
      categoryId,
      pageNumber: 1,
    }));
  }, []);

  const setBrandId = useCallback((brandId: string | undefined) => {
    setFilters((prev) => ({
      ...prev,
      brandId,
      pageNumber: 1,
    }));
  }, []);

  const setMinPrice = useCallback((minPrice: number | undefined) => {
    setFilters((prev) => ({
      ...prev,
      minPrice,
      pageNumber: 1,
    }));
  }, []);

  const setMaxPrice = useCallback((maxPrice: number | undefined) => {
    setFilters((prev) => ({
      ...prev,
      maxPrice,
      pageNumber: 1,
    }));
  }, []);

  const setSortBy = useCallback((sortBy: string | undefined) => {
    setFilters((prev) => ({
      ...prev,
      sortBy,
      pageNumber: 1,
    }));
  }, []);

  const toggleRoastLevel = useCallback((id: string) => {
    setFilters((prev) => {
      const newRoastLevelIds = prev.roastLevelIds.includes(id)
        ? prev.roastLevelIds.filter((rid) => rid !== id)
        : [...prev.roastLevelIds, id];

      return {
        ...prev,
        roastLevelIds: newRoastLevelIds,
        pageNumber: 1,
      };
    });
  }, []);

  const toggleOrigin = useCallback((id: string) => {
    setFilters((prev) => {
      const newOriginIds = prev.originIds.includes(id)
        ? prev.originIds.filter((oid) => oid !== id)
        : [...prev.originIds, id];

      return {
        ...prev,
        originIds: newOriginIds,
        pageNumber: 1,
      };
    });
  }, []);

  const setPageNumber = useCallback((pageNumber: number) => {
    setFilters((prev) => ({
      ...prev,
      pageNumber,
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  return {
    filters,
    setSearch,
    setCategoryId,
    setBrandId,
    setMinPrice,
    setMaxPrice,
    setSortBy,
    toggleRoastLevel,
    toggleOrigin,
    setPageNumber,
    resetFilters,
  };
}
