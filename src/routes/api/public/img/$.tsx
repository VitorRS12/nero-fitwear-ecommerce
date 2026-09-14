import { createFileRoute } from "@tanstack/react-router";

/**
 * Entrega pública das fotos de produto guardadas no bucket privado
 * `product-images`. O bucket segue privado (só admin escreve) e a leitura
 * acontece por aqui, com cache agressivo de CDN.
 */
export const Route = createFileRoute("/api/public/img/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const path = (params as { _splat?: string })._splat ?? "";
        if (!path || path.includes("..")) {
          return new Response("Not found", { status: 404 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.storage.from("product-images").download(path);

        if (error || !data) {
          return new Response("Not found", { status: 404 });
        }

        return new Response(data, {
          headers: {
            "content-type": data.type || "image/jpeg",
            "cache-control": "public, max-age=31536000, immutable",
          },
        });
      },
    },
  },
});
