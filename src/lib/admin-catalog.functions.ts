import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { PRODUCT_IMAGE_BUCKET, storagePathToUrl, urlToStoragePath } from "@/lib/product-images";

/**
 * Camada de escrita do catálogo (área restrita).
 * Todas as funções rodam como o usuário logado; as políticas RLS
 * `*_admin_all` garantem que só quem tem papel `admin` consegue gravar.
 */

type AuthedContext = {
  supabase: SupabaseClient<Database>;
  userId: string;
};


async function assertAdmin(context: AuthedContext) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Acesso restrito a administradores.");
}

const ADMIN_PRODUCT_SELECT = `
  id, name, slug, short_description, description, base_price, sale_price,
  is_featured, is_new, is_active, category_id, collection_id, tags, created_at,
  product_images ( id, url, alt, color, position, is_primary, focal_x, focal_y ),
  product_variants ( id, sku, color, color_hex, size, price, stock, is_active )
`;

export const adminIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await (context as AuthedContext).supabase.rpc("has_role", {
      _user_id: (context as AuthedContext).userId,
      _role: "admin",
    });
    return Boolean(data);
  });

export const adminListProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ctx = context as AuthedContext;
    await assertAdmin(ctx);
    const { data, error } = await ctx.supabase
      .from("products")
      .select(ADMIN_PRODUCT_SELECT)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminGetProduct = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const ctx = context as AuthedContext;
    await assertAdmin(ctx);
    const { data: product, error } = await ctx.supabase
      .from("products")
      .select(ADMIN_PRODUCT_SELECT)
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return product;
  });

export const adminTaxonomy = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ctx = context as AuthedContext;
    await assertAdmin(ctx);
    const [categories, collections] = await Promise.all([
      ctx.supabase.from("categories").select("id, name, slug, is_active").order("position"),
      ctx.supabase.from("collections").select("id, name, slug, is_active").order("name"),
    ]);
    if (categories.error) throw new Error(categories.error.message);
    if (collections.error) throw new Error(collections.error.message);
    return { categories: categories.data ?? [], collections: collections.data ?? [] };
  });

export const adminListCategories = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ctx = context as AuthedContext;
    await assertAdmin(ctx);
    const { data, error } = await ctx.supabase
      .from("categories")
      .select("id, name, slug, description, image_url, position, is_active, created_at, updated_at, focal_x, focal_y")
      .order("position", { ascending: true })
      .order("name", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const categorySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).nullable(),
  
  image_url: z.string().trim().nullable(),
  focal_x: z.number().min(0).max(100),
  focal_y: z.number().min(0).max(100),
 
 
  position: z.number().int().min(0),
  is_active: z.boolean(),
});

export const adminSaveCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => categorySchema.parse(input))
  .handler(async ({ data, context }) => {
    const ctx = context as AuthedContext;
    await assertAdmin(ctx);
    const previous = data.id
      ? await ctx.supabase.from("categories").select("image_url").eq("id", data.id).maybeSingle()
      : null;
    if (previous?.error) throw new Error(previous.error.message);

    const payload = {
      name: data.name,
      slug: data.slug,
      description: data.description,
      image_url: data.image_url,
      position: data.position,
      is_active: data.is_active,
    };
    const query = data.id
      ? ctx.supabase.from("categories").update(payload).eq("id", data.id)
      : ctx.supabase.from("categories").insert(payload);
    const { error } = await query;
    if (error?.code === "23505") throw new Error("Já existe uma categoria com esse endereço.");
    if (error) throw new Error(error.message);
    const previousPath = previous?.data?.image_url ? urlToStoragePath(previous.data.image_url) : null;
    const nextPath = data.image_url ? urlToStoragePath(data.image_url) : null;
    if (previousPath && previousPath !== nextPath) {
      await ctx.supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove([previousPath]);
    }
    return { ok: true };
  });

const variantSchema = z.object({
  id: z.string().uuid().optional(),
  sku: z.string().min(1),
  color: z.string().nullable(),
  color_hex: z.string().nullable(),
  size: z.string().nullable(),
  price: z.number().nonnegative().nullable(),
  stock: z.number().int().min(0),
});

const productSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2),
  slug: z.string().min(2),
  short_description: z.string().nullable(),
  description: z.string().nullable(),
  category_id: z.string().uuid().nullable(),
  collection_id: z.string().uuid().nullable(),
  base_price: z.number().nonnegative(),
  sale_price: z.number().nonnegative().nullable(),
  is_featured: z.boolean(),
  is_new: z.boolean(),
  is_active: z.boolean(),
  variants: z.array(variantSchema),
});

export const adminSaveProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => productSchema.parse(input))
  .handler(async ({ data, context }) => {
    const ctx = context as AuthedContext;
    await assertAdmin(ctx);

    const payload = {
      name: data.name,
      slug: data.slug,
      short_description: data.short_description,
      description: data.description,
      category_id: data.category_id,
      collection_id: data.collection_id,
      base_price: data.base_price,
      sale_price: data.sale_price,
      is_featured: data.is_featured,
      is_new: data.is_new,
      is_active: data.is_active,
    };

    let productId = data.id ?? null;

    if (productId) {
      const { error } = await ctx.supabase.from("products").update(payload).eq("id", productId);
      if (error) throw new Error(error.message);
    } else {
      const { data: created, error } = await ctx.supabase
        .from("products")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      productId = created.id;
    }

    const normalizedSkus = data.variants.map((variant) => variant.sku.trim().toUpperCase());
    if (new Set(normalizedSkus).size !== normalizedSkus.length) {
      throw new Error("Existem códigos de variação repetidos nesta peça.");
    }

    const { data: existingVariants, error: existingError } = await ctx.supabase
      .from("product_variants")
      .select("id, sku")
      .eq("product_id", productId);
    if (existingError) throw new Error(existingError.message);
    const existingBySku = new Map(
      (existingVariants ?? []).map((variant) => [variant.sku.trim().toUpperCase(), variant.id]),
    );

    const keptIds: string[] = [];
    for (const variant of data.variants) {
      const normalizedSku = variant.sku.trim().toUpperCase();
      const reconciledId = variant.id ?? existingBySku.get(normalizedSku);
      const row = {
        product_id: productId,
        sku: normalizedSku,
        color: variant.color,
        color_hex: variant.color_hex,
        size: variant.size,
        price: variant.price,
        stock: variant.stock,
        is_active: true,
      };
      if (reconciledId) {
        const { error } = await ctx.supabase
          .from("product_variants")
          .update(row)
          .eq("id", reconciledId)
          .eq("product_id", productId);
        if (error?.code === "23505") throw new Error(`O código ${normalizedSku} já pertence a outra variação.`);
        if (error) throw new Error(error.message);
        keptIds.push(reconciledId);
      } else {
        const { data: created, error } = await ctx.supabase
          .from("product_variants")
          .insert(row)
          .select("id")
          .single();
        if (error?.code === "23505") throw new Error(`O código ${normalizedSku} já pertence a outra variação.`);
        if (error) throw new Error(error.message);
        keptIds.push(created.id);
      }
    }

    // Variações removidas na tela ficam inativas (preserva histórico de pedidos).
    const { data: existing } = await ctx.supabase
      .from("product_variants")
      .select("id")
      .eq("product_id", productId);
    const stale = (existing ?? []).map((v) => v.id).filter((id) => !keptIds.includes(id));
    if (stale.length > 0) {
      await ctx.supabase.from("product_variants").update({ is_active: false }).in("id", stale);
    }

    return { id: productId };
  });

export const adminSetProductActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z.object({ id: z.string().uuid(), isActive: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as AuthedContext;
    await assertAdmin(ctx);
    const { error } = await ctx.supabase
      .from("products")
      .update({ is_active: data.isActive })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const ctx = context as AuthedContext;
    await assertAdmin(ctx);

    const { data: images } = await ctx.supabase
      .from("product_images")
      .select("url")
      .eq("product_id", data.id);

    const paths = (images ?? [])
      .map((image) => urlToStoragePath(image.url))
      .filter((path): path is string => Boolean(path));
    if (paths.length > 0) {
      await ctx.supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove(paths);
    }

    const { error } = await ctx.supabase.from("products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminAddImages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z
      .object({
        productId: z.string().uuid(),
        images: z
          .array(
            z.object({
              path: z.string().min(1),
              alt: z.string().nullable(),
              color: z.string().nullable(),
              focal_x: z.number().min(0).max(100).default(50),
              focal_y: z.number().min(0).max(100).default(50),
            }),
          )
          .min(1),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as AuthedContext;
    await assertAdmin(ctx);

    const { data: existing } = await ctx.supabase
      .from("product_images")
      .select("id, position")
      .eq("product_id", data.productId)
      .order("position", { ascending: false })
      .limit(1);

    const start = (existing?.[0]?.position ?? -1) + 1;
    const isFirst = start === 0;

    const rows = data.images.map((image, index) => ({
      product_id: data.productId,
      url: storagePathToUrl(image.path),
      alt: image.alt,
      color: image.color,
      focal_x: image.focal_x,
      focal_y: image.focal_y,
      position: start + index,
      is_primary: isFirst && index === 0,
    }));

    const { error } = await ctx.supabase
      .from("product_images")
      .insert(
        rows as unknown as Database["public"]["Tables"]["product_images"]["Insert"][],
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminUpdateImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        alt: z.string().nullable().optional(),
        color: z.string().nullable().optional(),
        focal_x: z.number().min(0).max(100).optional(),
        focal_y: z.number().min(0).max(100).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as AuthedContext;
    await assertAdmin(ctx);

    const patch: { alt?: string | null; color?: string | null; focal_x?: number; focal_y?: number } = {};
    if (data.alt !== undefined) patch.alt = data.alt;
    if (data.color !== undefined) patch.color = data.color;
    if (data.focal_x !== undefined) patch.focal_x = data.focal_x;
    if (data.focal_y !== undefined) patch.focal_y = data.focal_y;
    if (Object.keys(patch).length === 0) return { ok: true };


    const { error } = await ctx.supabase
      .from("product_images")
      .update(patch as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const ctx = context as AuthedContext;
    await assertAdmin(ctx);

    const { data: image } = await ctx.supabase
      .from("product_images")
      .select("url")
      .eq("id", data.id)
      .maybeSingle();

    const path = image ? urlToStoragePath(image.url) : null;
    if (path) await ctx.supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove([path]);

    const { error } = await ctx.supabase.from("product_images").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminReorderImages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z
      .object({ productId: z.string().uuid(), ids: z.array(z.string().uuid()).min(1) })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as AuthedContext;
    await assertAdmin(ctx);

    for (const [index, id] of data.ids.entries()) {
      const { error } = await ctx.supabase
        .from("product_images")
        .update({ position: index, is_primary: index === 0 })
        .eq("id", id)
        .eq("product_id", data.productId);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

/* ---------- Imagens da tela inicial ---------- */

const homeSlotSchema = z.enum(["hero", "banner"]);

export const adminListHomeMedia = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ctx = context as AuthedContext;
    await assertAdmin(ctx);
    const { data, error } = await ctx.supabase
      .from("home_media")
      .select("id, slot, url, alt, is_active, focal_x, focal_y");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminSetHomeMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z
      .object({
        slot: homeSlotSchema,
        path: z.string().min(1),
        alt: z.string().nullable().default(null),
        focal_x: z.number().min(0).max(100).default(50),
        focal_y: z.number().min(0).max(100).default(50),
        is_active: z.boolean().default(true),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as AuthedContext;
    await assertAdmin(ctx);

    // A imagem anterior do mesmo espaço sai do armazenamento.
    const { data: previous } = await ctx.supabase
      .from("home_media")
      .select("url")
      .eq("slot", data.slot)
      .maybeSingle();
    const previousPath = previous ? urlToStoragePath(previous.url) : null;

    const homeMedia = {
      slot: data.slot,
      url: storagePathToUrl(data.path),
      alt: data.alt,
      focal_x: data.focal_x,
      focal_y: data.focal_y,
      is_active: data.is_active,
    } as unknown as Database["public"]["Tables"]["home_media"]["Insert"];

    const { error } = await ctx.supabase
      .from("home_media")
      .upsert(homeMedia, { onConflict: "slot" });
    if (error) throw new Error(error.message);

    if (previousPath && previousPath !== data.path) {
      await ctx.supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove([previousPath]);
    }
    return { ok: true };
  });

export const adminToggleHomeMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z.object({ slot: homeSlotSchema, isActive: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as AuthedContext;
    await assertAdmin(ctx);
    const { error } = await ctx.supabase
      .from("home_media")
      .update({ is_active: data.isActive })
      .eq("slot", data.slot);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteHomeMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ slot: homeSlotSchema }).parse(input))
  .handler(async ({ data, context }) => {
    const ctx = context as AuthedContext;
    await assertAdmin(ctx);

    const { data: current } = await ctx.supabase
      .from("home_media")
      .select("url")
      .eq("slot", data.slot)
      .maybeSingle();
    const path = current ? urlToStoragePath(current.url) : null;
    if (path) await ctx.supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove([path]);

    const { error } = await ctx.supabase.from("home_media").delete().eq("slot", data.slot);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
