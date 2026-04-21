import { useState, useCallback, useEffect, useRef } from "react";
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
  color?: string;
}

export interface UseShopFiltersReturn {
  filters: ShopFiltersState;
  setSearch: (search: string) => void;
  setCategoryId: (categoryId: string | undefined) => void;
  setBrandId: (brandId: string | undefined) => void;
  setMinPrice: (minPrice: number | undefined) => void;
  setMaxPrice: (maxPrice: number | undefined) => void;
  setColor: (color: string | undefined) => void;
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

/** Keys managed by this hook — preserved params like "category" slug are left untouched. */
const MANAGED_KEYS = [
  "brandId", "search", "minPrice", "maxPrice", "color",
  "sortBy", "roastLevelIds", "originIds",
];

export function useShopFilters(): UseShopFiltersReturn {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isUpdatingUrl = useRef(false);

  const [filters, setFilters] = useState<ShopFiltersState>(() => {
    // Hydrate ALL filter state from URL on first mount
    const brandId = searchParams.get("brandId") || undefined;
    const search = searchParams.get("search") || "";
    const minPrice = searchParams.has("minPrice") ? Number(searchParams.get("minPrice")) : undefined;
    const maxPrice = searchParams.has("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined;
    const color = searchParams.get("color") || undefined;
    const sortBy = searchParams.get("sortBy") || undefined;
    const roastLevelIds = searchParams.getAll("roastLevelIds");
    const originIds = searchParams.getAll("originIds");
    return {
      ...DEFAULT_FILTERS,
      brandId, search, minPrice, maxPrice, color, sortBy,
      roastLevelIds: roastLevelIds.length > 0 ? roastLevelIds : [],
      originIds: originIds.length > 0 ? originIds : [],
    };
  });

  // Sync ALL managed filter params → URL
  useEffect(() => {
    if (isUpdatingUrl.current) {
      isUpdatingUrl.current = false;
      return;
    }

    const params = new URLSearchParams();

    // Preserve unmanaged params (e.g. "category" slug)
    searchParams.forEach((value, key) => {
      if (!MANAGED_KEYS.includes(key)) {
        params.append(key, value);
      }
    });

    // Append managed params from filter state
    if (filters.search) params.set("search", filters.search);
    if (filters.brandId) params.set("brandId", filters.brandId);
    if (filters.minPrice !== undefined && !isNaN(filters.minPrice)) params.set("minPrice", String(filters.minPrice));
    if (filters.maxPrice !== undefined && !isNaN(filters.maxPrice)) params.set("maxPrice", String(filters.maxPrice));
    if (filters.color) params.set("color", filters.color);
    if (filters.sortBy) params.set("sortBy", filters.sortBy);
    filters.roastLevelIds.forEach((id) => params.append("roastLevelIds", id));
    filters.originIds.forEach((id) => params.append("originIds", id));

    const newQs = params.toString();
    const currentQs = searchParams.toString();

    if (newQs !== currentQs) {
      isUpdatingUrl.current = true;
      router.replace(`${pathname}${newQs ? `?${newQs}` : ""}`, { scroll: false });
    }
  }, [filters, pathname, router, searchParams]);

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

  const setColor = useCallback((color: string | undefined) => {
    setFilters((prev) => ({
      ...prev,
      color,
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
    setColor,
    setSortBy,
    toggleRoastLevel,
    toggleOrigin,
    setPageNumber,
    resetFilters,
  };
}
