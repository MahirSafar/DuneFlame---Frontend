import type { MetadataRoute } from "next";

import { getProducts, type ProductResponse } from "@/lib/services/products";

const BASE_URL = "https://duneflame.com";
const LOCALES = ["en", "ar"] as const;
const STATIC_ROUTES = ["", "/products", "/about", "/contact", "/policies", "/wholesale"] as const;

async function getAllProducts(): Promise<ProductResponse[]> {
  const pageSize = 100;
  const firstPage = await getProducts({ pageNumber: 1, pageSize });

  if (firstPage.totalPages <= 1) {
    return firstPage.items;
  }

  const restPages = await Promise.all(
    Array.from({ length: firstPage.totalPages - 1 }, (_, index) =>
      getProducts({ pageNumber: index + 2, pageSize })
    )
  );

  return [firstPage, ...restPages].flatMap((page) => page.items);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = LOCALES.flatMap((locale) =>
    STATIC_ROUTES.map((route) => ({
      url: `${BASE_URL}/${locale}${route}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: route === "" ? 1.0 : 0.8,
    }))
  );

  let products: ProductResponse[] = [];
  try {
    products = await getAllProducts();
  } catch {
    // Keep sitemap generation resilient if product API is temporarily unavailable.
    products = [];
  }

  const seen = new Set<string>();
  const productEntries: MetadataRoute.Sitemap = LOCALES.flatMap((locale) =>
    products.flatMap((product) => {
      const slugOrId = product.slug || product.id;
      if (!slugOrId) return [];

      const uniqueKey = `${locale}:${slugOrId}`;
      if (seen.has(uniqueKey)) return [];
      seen.add(uniqueKey);

      return {
        url: `${BASE_URL}/${locale}/product/${slugOrId}`,
        lastModified: product.updatedAt ?? product.createdAt ?? new Date(),
        changeFrequency: "daily",
        priority: 0.9,
      };
    })
  );

  return [...staticEntries, ...productEntries];
}
