import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Trash2, UploadCloud } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImagePositionEditor, type ImagePosition } from "@/components/ui/image-position-editor";
import { supabase } from "@/integrations/supabase/client";
import {
  adminDeleteHomeMedia,
  adminSetHomeMedia,
  adminToggleHomeMedia,
} from "@/lib/admin-catalog.functions";
import { PRODUCT_IMAGE_BUCKET } from "@/lib/product-images";
import type { HomeMedia, HomeSlot } from "@/services/home-media.service";

interface HomeMediaSlotProps {
  slot: HomeSlot;
  title: string;
  hint: string;
  media: HomeMedia | undefined;
}

/** Um espaço da tela inicial: envia, descreve, liga/desliga e remove a imagem. */
export function HomeMediaSlot({ slot, title, hint, media }: HomeMediaSlotProps) {
  const queryClient = useQueryClient();
  const setMedia = useServerFn(adminSetHomeMedia);
  const toggleMedia = useServerFn(adminToggleHomeMedia);
  const removeMedia = useServerFn(adminDeleteHomeMedia);

  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [focal, setFocal] = useState<ImagePosition>({
    x: media?.focal_x ?? 50,
    y: media?.focal_y ?? 50,
  });

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin", "home-media"] });
    await queryClient.invalidateQueries({ queryKey: ["home-media"] });
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `home/${slot}-${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from(PRODUCT_IMAGE_BUCKET)
        .upload(path, file, { cacheControl: "31536000", upsert: false });
      if (error) throw error;
      await setMedia({
        data: {
          slot,
          path,
          alt: media?.alt ?? null,
          focal_x: 50,
          focal_y: 50,
          is_active: true,
        },
      });
      toast.success("Imagem publicada na tela inicial.");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao enviar a imagem.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <section className="space-y-4 border border-border p-5">
      <div>
        <h2 className="text-2xl">{title}</h2>
        <p className="text-sm text-muted-foreground">{hint}</p>
      </div>

      <div className="relative">
        {media ? (
          <ImagePositionEditor
            src={media.url}
            alt={media.alt ?? "Prévia da imagem"}
            value={focal}
            onChange={setFocal}
            className="aspect-[16/7]"
          />
        ) : (
          <div className="flex aspect-[16/7] items-center justify-center border border-border bg-graphite text-sm text-muted-foreground">
            Nenhuma imagem escolhida
          </div>
        )}
        {media && !media.is_active ? (
          <span className="label-caps absolute left-3 top-3 bg-background/90 px-2 py-1">
            Oculta
          </span>
        ) : null}
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
          className="label-caps"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          <UploadCloud className="mr-2 size-4" />
          {uploading ? "Enviando..." : media ? "Trocar imagem" : "Escolher imagem"}
        </Button>

        {media ? (
          <>
            <Button
              type="button"
              variant="outline"
              className="label-caps"
              onClick={() => {
                const path = media.url.split("/api/public/img/")[1];
                if (!path) return;
                void setMedia({
                  data: {
                    slot,
                    path,
                    alt: media.alt,
                    focal_x: focal.x,
                    focal_y: focal.y,
                    is_active: media.is_active,
                  },
                })
                  .then(refresh)
                  .then(() => toast.success("Enquadramento salvo."));
              }}
            >
              Salvar enquadramento
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="label-caps"
              onClick={() =>
                void toggleMedia({ data: { slot, isActive: !media.is_active } }).then(refresh)
              }
            >
              {media.is_active ? "Ocultar da tela inicial" : "Exibir na tela inicial"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="label-caps"
              onClick={() => void removeMedia({ data: { slot } }).then(refresh)}
            >
              <Trash2 className="mr-2 size-4" /> Remover
            </Button>
          </>
        ) : null}
      </div>

      {media ? (
        <Input
          defaultValue={media.alt ?? ""}
          placeholder="Descrição da imagem (acessibilidade)"
          onBlur={(event) => {
            const path = media.url.split("/api/public/img/")[1];
            if (!path) return;
            void setMedia({
              data: {
                slot,
                path,
                alt: event.target.value || null,
                focal_x: focal.x,
                focal_y: focal.y,
                is_active: media.is_active,
              },
            }).then(refresh);
          }}
        />
      ) : null}
    </section>
  );
}
