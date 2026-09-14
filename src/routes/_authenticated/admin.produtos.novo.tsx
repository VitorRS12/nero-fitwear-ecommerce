import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { AdminShell } from "@/components/admin/AdminShell";
import { ProductForm } from "@/components/admin/ProductForm";
import { adminTaxonomyQuery } from "@/services/admin-product.service";

export const Route = createFileRoute("/_authenticated/admin/produtos/novo")({
  head: () => ({
    meta: [{ title: "Nova peça — NERO Fitwear" }, { name: "robots", content: "noindex" }],
  }),
  component: NewProductPage,
});

function NewProductPage() {
  const { data } = useQuery(adminTaxonomyQuery());

  return (
    <AdminShell title="Nova peça">
      <ProductForm categories={data?.categories ?? []} collections={data?.collections ?? []} />
    </AdminShell>
  );
}
