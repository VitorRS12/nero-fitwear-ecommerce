import { queryOptions } from "@tanstack/react-query";

import {
  adminGetProduct,
  adminIsAdmin,
  adminListCategories,
  adminListProducts,
  adminTaxonomy,
} from "@/lib/admin-catalog.functions";

export interface AdminVariant {
  id: string;
  sku: string;
  color: string | null;
  color_hex: string | null;
  size: string | null;
  price: number | null;
  stock: number;
  is_active: boolean;
}

export interface AdminImage {
  id: string;
  url: string;
  alt: string | null;
  color: string | null;
  position: number;
  is_primary: boolean;
  focal_x: number;
  focal_y: number;
}

export interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  base_price: number;
  sale_price: number | null;
  is_featured: boolean;
  is_new: boolean;
  is_active: boolean;
  category_id: string | null;
  collection_id: string | null;
  tags: string[];
  created_at: string;
  product_images: AdminImage[];
  product_variants: AdminVariant[];
}

export interface TaxonomyItem {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
}

export interface AdminCategory extends TaxonomyItem {
  description: string | null;
  image_url: string | null;
  position: number;
  focal_x: number;
  focal_y: number;
  created_at: string;
  updated_at: string;
}

export const isAdminQuery = () =>
  queryOptions({
    queryKey: ["admin", "is-admin"],
    queryFn: async () => await adminIsAdmin(),
    staleTime: 5 * 60 * 1000,
  });

export const adminProductsQuery = () =>
  queryOptions({
    queryKey: ["admin", "products"],
    queryFn: async () => (await adminListProducts()) as unknown as AdminProduct[],
    staleTime: 10 * 1000,
  });

export const adminProductQuery = (id: string) =>
  queryOptions({
    queryKey: ["admin", "product", id],
    queryFn: async () =>
      (await adminGetProduct({ data: { id } })) as unknown as AdminProduct | null,
    staleTime: 10 * 1000,
  });

export const adminTaxonomyQuery = () =>
  queryOptions({
    queryKey: ["admin", "taxonomy"],
    queryFn: async () =>
      (await adminTaxonomy()) as unknown as {
        categories: TaxonomyItem[];
        collections: TaxonomyItem[];
      },
    staleTime: 5 * 60 * 1000,
  });

export const adminCategoriesQuery = () =>
  queryOptions({
    queryKey: ["admin", "categories"],
    queryFn: async () => (await adminListCategories()) as unknown as AdminCategory[],
    staleTime: 10 * 1000,
  });
