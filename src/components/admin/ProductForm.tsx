import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { ImageUploader } from "@/components/admin/ImageUploader";
import { VariantMatrix, type VariantDraft } from "@/components/admin/VariantMatrix";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { adminSaveProduct } from "@/lib/admin-catalog.functions";
import { slugify } from "@/lib/product-images";
import type { AdminProduct, TaxonomyItem } from "@/services/admin-product.service";

interface ProductFormProps {
  product?: AdminProduct | null;
  categories: TaxonomyItem[];
  collections: TaxonomyItem[];
}

export function ProductForm({ product, categories, collections }: ProductFormProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const saveProduct = useServerFn(adminSaveProduct);

  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [shortDescription, setShortDescription] = useState(product?.short_description ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [categoryId, setCategoryId] = useState(product?.category_id ?? "");
  const [collectionId, setCollectionId] = useState(product?.collection_id ?? "");
  const [basePrice, setBasePrice] = useState(String(product?.base_price ?? ""));
  const [salePrice, setSalePrice] = useState(
    product?.sale_price != null ? String(product.sale_price) : "",
  );
  const [isFeatured, setIsFeatured] = useState(product?.is_featured ?? false);
  const [isNew, setIsNew] = useState(product?.is_new ?? true);
  const [isActive, setIsActive] = useState(product?.is_active ?? true);
  const [saving, setSaving] = useState(false);

  const [variants, setVariants] = useState<VariantDraft[]>(
    (product?.product_variants ?? [])
      .filter((variant) => variant.is_active)
      .map((variant) => ({
        id: variant.id,
        sku: variant.sku,
        color: variant.color,
        color_hex: variant.color_hex,
        size: variant.size,
        price: variant.price,
        stock: variant.stock,
      })),
  );

  const colors = Array.from(
    new Set(variants.map((variant) => variant.color).filter(Boolean) as string[]),
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const finalSlug = slugify(slug || name);
    if (!name.trim() || !finalSlug) {
      toast.error("Informe o nome da peça.");
      return;
    }
    if (!basePrice || Number(basePrice) <= 0) {
      toast.error("Informe o preço da peça.");
      return;
    }
    if (salePrice && Number(salePrice) >= Number(basePrice)) {
      toast.error("O preço promocional deve ser menor que o normal.");
      return;
    }
    
    setSaving(true);
    try {
      const result = await saveProduct({
        data: {
          ...(product?.id ? { id: product.id } : {}),
          name: name.trim(),
          slug: finalSlug,
          short_description: shortDescription.trim() || null,
          description: description.trim() || null,
          category_id: categoryId || null,
          collection_id: collectionId || null,
          base_price: Number(basePrice),
          sale_price: salePrice ? Number(salePrice) : null,
          is_featured: isFeatured,
          is_new: isNew,
          is_active: isActive,
          variants,
        },
      });

      await queryClient.invalidateQueries({ queryKey: ["admin"] });
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      await queryClient.invalidateQueries({ queryKey: ["product"] });
      toast.success("Peça salva.");

      if (!product?.id && result?.id) {
        void navigate({ to: "/admin/produtos/$id", params: { id: result.id } });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Nome da peça</Label>
          <Input
            id="name"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              if (!product?.id) setSlug(slugify(event.target.value));
            }}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Endereço da página</Label>
          <Input id="slug" value={slug} onChange={(event) => setSlug(slugify(event.target.value))} />
          <p className="text-xs text-muted-foreground">/produto/{slug || "..."}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Categoria</Label>
          <select
            id="category"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className="h-9 w-full border border-border bg-background px-2 text-sm"
          >
            <option value="">Sem categoria</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="collection">Coleção</Label>
          <select
            id="collection"
            value={collectionId}
            onChange={(event) => setCollectionId(event.target.value)}
            className="h-9 w-full border border-border bg-background px-2 text-sm"
          >
            <option value="">Sem coleção</option>
            {collections.map((collection) => (
              <option key={collection.id} value={collection.id}>
                {collection.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="base-price">Preço (R$)</Label>
          <Input
            id="base-price"
            type="number"
            step="0.01"
            min="0"
            value={basePrice}
            onChange={(event) => setBasePrice(event.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sale-price">Preço promocional (R$)</Label>
          <Input
            id="sale-price"
            type="number"
            step="0.01"
            min="0"
            value={salePrice}
            onChange={(event) => setSalePrice(event.target.value)}
          />
        </div>

        <div className="space-y-2 lg:col-span-2">
          <Label htmlFor="short">Descrição curta</Label>
          <Input
            id="short"
            value={shortDescription}
            onChange={(event) => setShortDescription(event.target.value)}
            maxLength={160}
          />
        </div>
        <div className="space-y-2 lg:col-span-2">
          <Label htmlFor="description">Descrição completa</Label>
          <Textarea
            id="description"
            rows={6}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-8 lg:col-span-2">
          <label className="flex items-center gap-3 text-sm">
            <Switch checked={isActive} onCheckedChange={setIsActive} /> Visível na loja
          </label>
          <label className="flex items-center gap-3 text-sm">
            <Switch checked={isFeatured} onCheckedChange={setIsFeatured} /> Destaque na home
          </label>
          <label className="flex items-center gap-3 text-sm">
            <Switch checked={isNew} onCheckedChange={setIsNew} /> Novidade
          </label>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl">Cores, tamanhos e estoque</h2>
        <VariantMatrix baseSlug={slug || name} variants={variants} onChange={setVariants} />
      </section>

      <div className="flex gap-3">
        <Button type="submit" className="label-caps" disabled={saving}>
          {saving ? "Salvando..." : "Salvar peça"}
        </Button>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl">Fotos</h2>
        {product?.id ? (
          <ImageUploader
            productId={product.id}
            images={product.product_images ?? []}
            colors={colors}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            Salve a peça primeiro para liberar o envio de fotos.
          </p>
        )}
      </section>
    </form>
  );
}
