import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database } from "@/integrations/supabase/types";

/**
 * Camada de leitura pública do catálogo.
 * Roda no servidor (SSR + SEO) com a chave publicável e respeita as
 * políticas RLS de leitura pública (`is_active`).
 */
function createPublicClient() {
  const url = process.env["SUPABASE_URL"]!;
  const key = (process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"])!;

  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input: RequestInfo | URL, init?: RequestInit) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

const PRODUCT_SELECT = `
  id, name, slug, short_description, description, base_price, sale_price,
  is_featured, is_new, category_id, created_at,
  product_images ( id, url, alt, color, position ),
  product_variants ( id, sku, color, color_hex, size, price, stock, image_url )
`;

export const listCategories = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, description, image_url, position")
    .eq("is_active", true)
    .order("position", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
});

const listProductsSchema = z.object({
  category: z.string().optional(),
  featured: z.boolean().optional(),
  isNew: z.boolean().optional(),
  search: z.string().optional(),
  limit: z.number().int().positive().max(60).optional(),
});

export const listProducts = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => listProductsSchema.parse(input ?? {}))
  .handler(async ({ data }) => {
    const supabase = createPublicClient();
    let query = supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (data.featured) query = query.eq("is_featured", true);
    if (data.isNew) query = query.eq("is_new", true);
    if (data.search) query = query.ilike("name", `%${data.search}%`);
    if (data.limit) query = query.limit(data.limit);

    if (data.category) {
      const { data: category } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", data.category)
        .maybeSingle();
      if (!category) return [];
      query = query.eq("category_id", category.id);
    }

    const { data: products, error } = await query;
    if (error) throw new Error(error.message);
    return products ?? [];
  });

export const getProductBySlug = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ slug: z.string().min(1) }).parse(input))
  .handler(async ({ data }) => {
    const supabase = createPublicClient();
    const { data: product, error } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("slug", data.slug)
      .eq("is_active", true)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return product;
  });

/** Imagens marcadas para aparecer na tela inicial (capa e faixa promocional). */
export const listHomeMedia = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("home_media")
    .select("id, slot, url, alt, is_active")
    .eq("is_active", true);

  if (error) throw new Error(error.message);
  return data ?? [];
});
