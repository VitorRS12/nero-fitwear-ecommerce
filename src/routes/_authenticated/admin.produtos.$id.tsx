import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";

import { AdminShell } from "@/components/admin/AdminShell";
import { ProductForm } from "@/components/admin/ProductForm";
import { adminProductQuery, adminTaxonomyQuery } from "@/services/admin-product.service";
import { property } from "zod/v4";

export const Route = createFileRoute("/_authenticated/admin/produtos/$id")({
  head: () => ({
    meta: [
      { title: "Editar peça — NERO Fitwear" }, 
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Edite os dados, variações e fotos de uma peça NERO Fitwear" },
      { property: "og:description", content: "Editar peça -- Nero Fitwear" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: " robots ", content: "noindex" }    
    ],
    }),
  component: EditProductPage,
});

function EditProductPage() {
  const router = useRouter();
  const { id } = Route.useParams();
  const { data: product, isLoading } = useQuery(adminProductQuery(id));
  const { data: taxonomy } = useQuery(adminTaxonomyQuery());

  return (
    <AdminShell title={product?.name ?? "Editar peça"}>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : !product ? (
        <p className="text-sm text-muted-foreground">Peça não encontrada.</p>
      ) : (
        <ProductForm
          product={product}
          categories={taxonomy?.categories ?? []}
          collections={taxonomy?.collections ?? []}
        />
      )}
    </AdminShell>
  );
}
