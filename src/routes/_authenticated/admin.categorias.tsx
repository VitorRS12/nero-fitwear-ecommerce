import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { AdminShell } from "@/components/admin/AdminShell";
import { CategoryAdminCard } from "@/components/admin/CategoryAdminCard";
import { adminCategoriesQuery } from "@/services/admin-product.service";

export const Route = createFileRoute("/_authenticated/admin/categorias")({
  head: () => ({
    meta: [
      { title: "Categorias — NERO Fitwear" },
      { name: "description", content: "Gerencie as categorias do catálogo NERO Fitwear." },
      { property: "og:title", content: "Categorias — NERO Fitwear" },
      { property: "og:description", content: "Gerencie as categorias do catálogo NERO Fitwear." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminCategoriesPage,
});

function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const categories = useQuery(adminCategoriesQuery());
  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
    await queryClient.invalidateQueries({ queryKey: ["categories"] });
  };

  return (
    <AdminShell title="Categorias">
      <div className="space-y-8">
        <section className="space-y-3">
          <h2 className="text-2xl">Nova categoria</h2>
          <CategoryAdminCard onSaved={refresh} />
        </section>
        <section className="space-y-3">
          <h2 className="text-2xl">Categorias cadastradas</h2>
          {categories.isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {(categories.data ?? []).map((category) => (
                <CategoryAdminCard key={category.id} category={category} onSaved={refresh} />
              ))}
            </div>
          )}
        </section>
      </div>
    </AdminShell>
  );
}