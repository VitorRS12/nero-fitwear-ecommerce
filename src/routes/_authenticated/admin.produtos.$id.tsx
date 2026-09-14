import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { AdminShell } from "@/components/admin/AdminShell";
import { ProductForm } from "@/components/admin/ProductForm";
import { adminProductQuery, adminTaxonomyQuery } from "@/services/admin-product.service";

export const Route = createFileRoute("/_authenticated/admin/produtos/$id")({
  head: () => ({
    meta: [{ title: "Editar peça — NERO Fitwear" }, { name: "robots", content: "noindex" }],
  }),
  component: EditProductPage,
});

function EditProductPage() {
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
