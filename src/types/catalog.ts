/** Tipos de domínio do catálogo NERO Fitwear. */

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  position: number;
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
  color: string | null;
  position: number;
}

export interface ProductVariant {
  id: string;
  sku: string;
  color: string | null;
  color_hex: string | null;
  size: string | null;
  price: number | null;
  stock: number;
  image_url: string | null;
}

export interface ProductSummary {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  base_price: number;
  sale_price: number | null;
  is_featured: boolean;
  is_new: boolean;
  category_id: string | null;
  created_at: string;
  product_images: ProductImage[];
  product_variants: ProductVariant[];
}

export interface ProductDetail extends ProductSummary {
  description: string | null;
}

export type SortOption = "recent" | "price-asc" | "price-desc" | "name";

export interface CatalogFilters {
  category?: string;
  sizes?: string[];
  colors?: string[];
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  search?: string;
  sort?: SortOption;
}
