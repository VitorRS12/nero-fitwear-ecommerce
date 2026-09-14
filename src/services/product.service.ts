import { queryOptions } from "@tanstack/react-query";

import { getProductBySlug, listCategories, listProducts } from "@/lib/catalog.functions";
import type { Category, ProductDetail, ProductSummary } from "@/types/catalog";

export interface ListProductsParams {
  category?: string;
  featured?: boolean;
  isNew?: boolean;
  search?: string;
  limit?: number;
}

export const categoriesQuery = () =>
  queryOptions({
    queryKey: ["categories"],
    queryFn: async () => (await listCategories()) as unknown as Category[],
    staleTime: 5 * 60 * 1000,
  });

export const productsQuery = (params: ListProductsParams = {}) =>
  queryOptions({
    queryKey: ["products", params],
    queryFn: async () => (await listProducts({ data: params })) as unknown as ProductSummary[],
    staleTime: 60 * 1000,
  });

export const productQuery = (slug: string) =>
  queryOptions({
    queryKey: ["product", slug],
    queryFn: async () =>
      (await getProductBySlug({ data: { slug } })) as unknown as ProductDetail | null,
    staleTime: 60 * 1000,
  });
