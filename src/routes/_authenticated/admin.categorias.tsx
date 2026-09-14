import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { AdminShell } from "@/components/admin/AdminShell";
import { CategoryAdminCard } from "@/components/admin/CategoryAdminCard";
import { adminCategoriesQuery } from "@/services/admin-category.service";

export const Route = createFileRoute("/_authenticated/admin/categorias")({
  ssr: false,
  head: () => ({ meta: [{ title: "Categorias — NERO Fitwear" }] }),
  component: AdminCategoriesPage,
});

function AdminCategoriesPage() {
  const { data: categories = [], isLoading } = useQuery(adminCategoriesQuery());

  return (
    <AdminShell title="Categorias">
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <CategoryAdminCard key={category.id} category={category} />
          ))}
        </div>
      )}
    </AdminShell>
  );
}
