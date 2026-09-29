import { useServerFn } from "@tanstack/react-start";
import { ImagePlus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
  
import { supabase } from "@/integrations/supabase/client";
=======
  
=======
import { ImagePositionEditor, type ImagePosition } from "@/components/ui/image-position-editor";
import { supabase } from "@/integrations/supabase/client";
 
 
import { adminSaveCategory } from "@/lib/admin-catalog.functions";
import {
  PRODUCT_IMAGE_BUCKET,
  slugify,
  storagePathToUrl,
  urlToStoragePath,
} from "@/lib/product-images";
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
  
  const [imageUrl, setImageUrl] = useState<string | null>(category?.image_url ?? null);
=======
  
=======
  const [imageUrl, setImageUrl] = useState<string | null>(category?.image_url ?? null);
  const [focal, setFocal] = useState<ImagePosition>({
    x: category?.focal_x ?? 50,
    y: category?.focal_y ?? 50,
  });
 
 
  const [position, setPosition] = useState(String(category?.position ?? 0));
  const [isActive, setIsActive] = useState(category?.is_active ?? true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setName(category?.name ?? "");
    setSlug(category?.slug ?? "");
    setDescription(category?.description ?? "");
  
    setImageUrl(category?.image_url ?? null);
=======
  
=======
    setImageUrl(category?.image_url ?? null);
    setFocal({ x: category?.focal_x ?? 50, y: category?.focal_y ?? 50 });
 
 
    setPosition(String(category?.position ?? 0));
    setIsActive(category?.is_active ?? true);
  };

  
=======
  
=======
 
  const handleImage = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Escolha um arquivo de imagem.");
      return;
    }
    setUploading(true);
    try {
      const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `categories/${slugify(name) || "categoria"}-${crypto.randomUUID()}.${extension}`;
      const { error } = await supabase.storage
        .from(PRODUCT_IMAGE_BUCKET)
        .upload(path, file, { cacheControl: "31536000", upsert: false });
      if (error) throw error;

      const previousUnsavedPath = imageUrl && imageUrl !== category?.image_url
        ? urlToStoragePath(imageUrl)
        : null;
      if (previousUnsavedPath) {
        await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove([previousUnsavedPath]);
      }
      setImageUrl(storagePathToUrl(path));
  
=======
      setFocal({ x: 50, y: 50 });
 
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível enviar a capa.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removeImage = async () => {
    const unsavedPath = imageUrl && imageUrl !== category?.image_url ? urlToStoragePath(imageUrl) : null;
    if (unsavedPath) await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove([unsavedPath]);
    setImageUrl(null);
  };

  
=======
 
 
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
  
          image_url: imageUrl,
=======
  
=======
          image_url: imageUrl,
          focal_x: focal.x,
          focal_y: focal.y,
 
 
          position: Number(position) || 0,
          is_active: isActive,
        },
      });
      await onSaved();
      toast.success(category ? "Categoria salva." : "Categoria criada.");
      if (!category) reset();
    } catch (error) {
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
  
      <div className="space-y-3">
        <Label>Capa na página inicial</Label>
        <div className="grid gap-3 sm:grid-cols-[10rem_1fr] sm:items-center">
          <div className="aspect-[4/5] overflow-hidden border border-border bg-graphite">
            {imageUrl ? (
              <img src={imageUrl} alt="Prévia da capa" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center p-3 text-center text-xs text-muted-foreground">
=======
  
=======
      <div className="space-y-3">
        <Label>Capa na página inicial</Label>
        <div className="grid gap-3 sm:grid-cols-[10rem_1fr] sm:items-center">
          <div>
            {imageUrl ? (
              <ImagePositionEditor
                src={imageUrl}
                alt="Prévia da capa"
                value={focal}
                onChange={setFocal}
                className="aspect-[4/5]"
              />
            ) : (
              <div className="flex aspect-[4/5] items-center justify-center border border-border bg-graphite p-3 text-center text-xs text-muted-foreground">
 
                Sem imagem
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => void handleImage(event.target.files?.[0])}
            />
            <Button
              type="button"
              variant="outline"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              <ImagePlus />
              {uploading ? "Enviando..." : imageUrl ? "Trocar capa" : "Escolher capa"}
            </Button>
            {imageUrl ? (
              <Button type="button" variant="ghost" onClick={() => void removeImage()}>
                <Trash2 /> Remover capa
              </Button>
            ) : null}
          </div>
        </div>
      </div>
  
=======
 
 
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