import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { adminSaveCategory } from "@/lib/admin-catalog.functions";
import { slugify } from "@/lib/product-images";
import type { AdminCategory } from "@/services/admin-product.service";

interface CategoryAdminCardProps {
  category?: AdminCategory;
  onSaved: () => Promise<void>;
}

export function CategoryAdminCard({ category, onSaved }: CategoryAdminCardProps) {
  const saveCategory = useServerFn(adminSaveCategory);
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [position, setPosition] = useState(String(category?.position ?? 0));
  const [isActive, setIsActive] = useState(category?.is_active ?? true);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setName(category?.name ?? "");
    setSlug(category?.slug ?? "");
    setDescription(category?.description ?? "");
    setPosition(String(category?.position ?? 0));
    setIsActive(category?.is_active ?? true);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const finalSlug = slugify(slug || name);
    if (!name.trim() || !finalSlug) {
      toast.error("Informe o nome da categoria.");
      return;
    }
    setSaving(true);
    try {
      await saveCategory({
        data: {
          ...(category?.id ? { id: category.id } : {}),
          name: name.trim(),
          slug: finalSlug,
          description: description.trim() || null,
          position: Number(position) || 0,
          is_active: isActive,
        },
      });
      await onSaved();
      toast.success(category ? "Categoria salva." : "Categoria criada.");
      if (!category) reset();
    } catch (error) {
      reset();
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar a categoria.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 border border-border bg-card p-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`category-name-${category?.id ?? "new"}`}>Nome</Label>
          <Input id={`category-name-${category?.id ?? "new"}`} value={name} onChange={(event) => setName(event.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`category-slug-${category?.id ?? "new"}`}>Endereço</Label>
          <Input id={`category-slug-${category?.id ?? "new"}`} value={slug} onChange={(event) => setSlug(slugify(event.target.value))} placeholder={slugify(name) || "categoria"} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`category-description-${category?.id ?? "new"}`}>Descrição</Label>
        <Textarea id={`category-description-${category?.id ?? "new"}`} value={description} onChange={(event) => setDescription(event.target.value)} />
      </div>
      <div className="flex flex-wrap items-end gap-6">
        <div className="w-28 space-y-2">
          <Label htmlFor={`category-position-${category?.id ?? "new"}`}>Posição</Label>
          <Input id={`category-position-${category?.id ?? "new"}`} type="number" min="0" value={position} onChange={(event) => setPosition(event.target.value)} />
        </div>
        <label className="flex h-9 items-center gap-3 text-sm">
          <Switch checked={isActive} onCheckedChange={setIsActive} /> Visível na loja
        </label>
        <Button type="submit" className="label-caps ml-auto" disabled={saving}>
          {saving ? "Salvando..." : "Salvar categoria"}
        </Button>
      </div>
    </form>
  );
}