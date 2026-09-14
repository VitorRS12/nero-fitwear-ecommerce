import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Trash2, UploadCloud } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import {
  adminRemoveCategoryImage,
  adminSetCategoryImage,
  adminUpdateCategory,
} from "@/lib/admin-catalog.functions";
import { PRODUCT_IMAGE_BUCKET } from "@/lib/product-images";
import type { AdminCategory } from "@/services/admin-category.service";

const randomId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

interface CategoryAdminCardProps {
  category: AdminCategory;
}

/** Um card de categoria na área restrita: capa, nome, slug, descrição. */
export function CategoryAdminCard({ category }: CategoryAdminCardProps) {
  const queryClient = useQueryClient();
  const setImage = useServerFn(adminSetCategoryImage);
  const removeImage = useServerFn(adminRemoveCategoryImage);
  const updateCategory = useServerFn(adminUpdateCategory);

  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
    await queryClient.invalidateQueries({ queryKey: ["categories"] });
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `categories/${category.slug}-${randomId()}.${ext}`;
      const { error } = await supabase.storage
        .from(PRODUCT_IMAGE_BUCKET)
        .upload(path, file, { cacheControl: "31536000", upsert: false });
      if (error) throw error;
      await setImage({ data: { id: category.id, path } });
      toast.success("Imagem da categoria atualizada.");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao enviar a imagem.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const saveField = async (patch: {
    name?: string;
    slug?: string;
    description?: string | null;
  }) => {
    try {
      await updateCategory({ data: { id: category.id, ...patch } });
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao salvar.");
    }
  };

  return (
    <section className="space-y-4 border border-border p-5">
      <div className="relative aspect-[4/5] overflow-hidden border border-border bg-graphite">
        {category.image_url ? (
          <img
            src={category.image_url}
            alt={category.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="font-display text-4xl text-muted-foreground opacity-30">nero</span>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => void handleFile(event.target.files?.[0])}
      />

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="label-caps"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          <UploadCloud className="mr-2 size-4" />
          {uploading ? "Enviando..." : category.image_url ? "Trocar imagem" : "Escolher imagem"}
        </Button>

        {category.image_url ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="label-caps"
            onClick={() => void removeImage({ data: { id: category.id } }).then(refresh)}
          >
            <Trash2 className="mr-2 size-4" /> Remover
          </Button>
        ) : null}
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor={`name-${category.id}`}>Nome</Label>
          <Input
            id={`name-${category.id}`}
            defaultValue={category.name}
            onBlur={(event) => {
              const value = event.target.value.trim();
              if (value && value !== category.name) void saveField({ name: value });
            }}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`slug-${category.id}`}>Slug (usado na URL)</Label>
          <Input
            id={`slug-${category.id}`}
            defaultValue={category.slug}
            onBlur={(event) => {
              const value = event.target.value.trim();
              if (value && value !== category.slug) void saveField({ slug: value });
            }}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`description-${category.id}`}>Descrição</Label>
          <Textarea
            id={`description-${category.id}`}
            defaultValue={category.description ?? ""}
            rows={2}
            onBlur={(event) => {
              const value = event.target.value.trim();
              if (value !== (category.description ?? "")) {
                void saveField({ description: value || null });
              }
            }}
          />
        </div>
      </div>
    </section>
  );
}
