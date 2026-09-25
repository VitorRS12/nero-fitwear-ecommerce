import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { GripVertical, Trash2, UploadCloud } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImagePositionEditor, type ImagePosition } from "@/components/ui/image-position-editor";
import { supabase } from "@/integrations/supabase/client";
import {
  adminAddImages,
  adminDeleteImage,
  adminReorderImages,
  adminUpdateImage,
} from "@/lib/admin-catalog.functions";
import { PRODUCT_IMAGE_BUCKET } from "@/lib/product-images";
import type { AdminImage } from "@/services/admin-product.service";

interface ImageUploaderProps {
  productId: string;
  images: AdminImage[];
  colors: string[];
}

/** Envio, ordenação e edição das fotos da peça. */
export function ImageUploader({ productId, images, colors }: ImageUploaderProps) {
  const queryClient = useQueryClient();
  const addImages = useServerFn(adminAddImages);
  const updateImage = useServerFn(adminUpdateImage);
  const deleteImage = useServerFn(adminDeleteImage);
  const reorderImages = useServerFn(adminReorderImages);

  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [order, setOrder] = useState<AdminImage[] | null>(null);

  const list = order ?? [...images].sort((a, b) => a.position - b.position);

  const refresh = async () => {
    setOrder(null);
    await queryClient.invalidateQueries({ queryKey: ["admin", "product", productId] });
    await queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
    await queryClient.invalidateQueries({ queryKey: ["products"] });
    await queryClient.invalidateQueries({ queryKey: ["product"] });
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploaded: { path: string; alt: string | null; color: string | null; focal_x: number; focal_y: number }[] = [];
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
        const path = `${productId}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage
          .from(PRODUCT_IMAGE_BUCKET)
          .upload(path, file, { cacheControl: "31536000", upsert: false });
        if (error) throw error;
        uploaded.push({ path, alt: null, color: null, focal_x: 50, focal_y: 50 });
      }
      await addImages({ data: { productId, images: uploaded } });
      toast.success(uploaded.length > 1 ? "Fotos enviadas." : "Foto enviada.");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao enviar a foto.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleDrop = async (index: number) => {
    if (dragIndex === null || dragIndex === index) return;
    const next = [...list];
    const moved = next.splice(dragIndex, 1)[0];
    if (!moved) return;
    next.splice(index, 0, moved);
    setOrder(next);
    setDragIndex(null);
    try {
      await reorderImages({ data: { productId, ids: next.map((image) => image.id) } });
      await refresh();
    } catch {
      toast.error("Não foi possível salvar a nova ordem.");
    }
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          void handleFiles(event.dataTransfer.files);
        }}
        className="flex flex-col items-center justify-center gap-3 border border-dashed border-border bg-graphite/40 p-8 text-center"
      >
        <UploadCloud className="size-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Arraste as fotos aqui ou escolha os arquivos. A primeira foto é a capa.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(event) => void handleFiles(event.target.files)}
        />
        <Button
          type="button"
          variant="outline"
          className="label-caps"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? "Enviando..." : "Escolher fotos"}
        </Button>
      </div>

      {list.length === 0 ? null : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((image, index) => (
            <li
              key={image.id}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => void handleDrop(index)}
              className="space-y-2 border border-border p-2"
            >
              <ProductImagePosition
                image={image}
                onSave={async (position) => {
                  await updateImage({
                    data: { id: image.id, focal_x: position.x, focal_y: position.y },
                  });
                  await refresh();
                }}
              >
                {index === 0 ? (
                  <span className="label-caps absolute left-2 top-2 bg-background/90 px-2 py-1">
                    Capa
                  </span>
                ) : null}
                <span className="absolute right-2 top-2 cursor-grab bg-background/90 p-1">
                  <GripVertical className="size-4" />
                </span>
              </ProductImagePosition>

              <Input
                defaultValue={image.alt ?? ""}
                placeholder="Descrição da imagem"
                onBlur={(event) =>
                  void updateImage({ data: { id: image.id, alt: event.target.value || null } }).then(
                    refresh,
                  )
                }
              />

              <select
                value={image.color ?? ""}
                onChange={(event) =>
                  void updateImage({
                    data: { id: image.id, color: event.target.value || null },
                  }).then(refresh)
                }
                className="h-9 w-full border border-border bg-background px-2 text-sm"
              >
                <option value="">Todas as cores</option>
                {colors.map((color) => (
                  <option key={color} value={color}>
                    {color}
                  </option>
                ))}
              </select>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="label-caps w-full"
                onClick={() => void deleteImage({ data: { id: image.id } }).then(refresh)}
              >
                <Trash2 className="mr-2 size-4" /> Excluir
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ProductImagePosition({
  image,
  onSave,
  children,
}: {
  image: AdminImage;
  onSave: (position: ImagePosition) => Promise<void>;
  children: React.ReactNode;
}) {
  const [position, setPosition] = useState<ImagePosition>({ x: image.focal_x, y: image.focal_y });
  const [saving, setSaving] = useState(false);

  return (
    <div className="space-y-2">
      <div className="relative">
        <ImagePositionEditor
          src={image.url}
          alt={image.alt ?? "Prévia da foto"}
          value={position}
          onChange={setPosition}
          className="aspect-[3/4]"
        />
        {children}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="label-caps w-full"
        disabled={saving}
        onClick={() => {
          setSaving(true);
          void onSave(position)
            .then(() => toast.success("Enquadramento salvo."))
            .catch(() => toast.error("Não foi possível salvar o enquadramento."))
            .finally(() => setSaving(false));
        }}
      >
        {saving ? "Salvando..." : "Salvar enquadramento"}
      </Button>
    </div>
  );
}
