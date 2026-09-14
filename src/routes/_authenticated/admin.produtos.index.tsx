import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin/AdminShell";
import { ProductThumb } from "@/components/shared/ProductThumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { adminDeleteProduct, adminSetProductActive } from "@/lib/admin-catalog.functions";
import { formatCurrency } from "@/lib/format";
import { adminProductsQuery } from "@/services/admin-product.service";

export const Route = createFileRoute("/_authenticated/admin/produtos/")({
  head: () => ({
    meta: [{ title: "Peças — NERO Fitwear" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminProductsPage,
});

function AdminProductsPage() {
  const queryClient = useQueryClient();
  const { data: products, isLoading } = useQuery(adminProductsQuery());
  const setActive = useServerFn(adminSetProductActive);
  const removeProduct = useServerFn(adminDeleteProduct);
  const [search, setSearch] = useState("");

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin"] });
    await queryClient.invalidateQueries({ queryKey: ["products"] });
  };

  const filtered = (products ?? []).filter((product) =>
    product.name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <AdminShell
      title="Peças"
      action={
        <Button asChild className="label-caps">
          <Link to="/admin/produtos/novo">Nova peça</Link>
        </Button>
      }
    >
      <div className="space-y-6">
        <Input
          placeholder="Buscar por nome"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="max-w-xs"
        />

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma peça cadastrada ainda.</p>
        ) : (
          <div className="overflow-x-auto border border-border">
            <table className="w-full text-sm">
              <thead className="bg-graphite text-left">
                <tr className="label-caps">
                  <th className="p-3">Peça</th>
                  <th className="p-3">Preço</th>
                  <th className="p-3">Estoque</th>
                  <th className="p-3">Fotos</th>
                  <th className="p-3">Na loja</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => {
                  const cover = [...(product.product_images ?? [])].sort(
                    (a, b) => a.position - b.position,
                  )[0];
                  const stock = (product.product_variants ?? [])
                    .filter((variant) => variant.is_active)
                    .reduce((total, variant) => total + variant.stock, 0);

                  return (
                    <tr key={product.id} className="border-t border-border">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="size-14 overflow-hidden bg-graphite">
                            <ProductThumb url={cover?.url} alt={product.name} />
                          </div>
                          <Link
                            to="/admin/produtos/$id"
                            params={{ id: product.id }}
                            className="underline-offset-4 hover:underline"
                          >
                            {product.name}
                          </Link>
                        </div>
                      </td>
                      <td className="p-3">
                        {formatCurrency(product.sale_price ?? product.base_price)}
                      </td>
                      <td className="p-3">{stock}</td>
                      <td className="p-3">{product.product_images?.length ?? 0}</td>
                      <td className="p-3">
                        <Switch
                          checked={product.is_active}
                          onCheckedChange={(checked) =>
                            void setActive({ data: { id: product.id, isActive: checked } })
                              .then(refresh)
                              .catch(() => toast.error("Não foi possível alterar."))
                          }
                        />
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="label-caps"
                          onClick={() => {
                            if (!window.confirm(`Excluir "${product.name}" e suas fotos?`)) return;
                            void removeProduct({ data: { id: product.id } })
                              .then(refresh)
                              .then(() => toast.success("Peça excluída."))
                              .catch(() => toast.error("Não foi possível excluir."));
                          }}
                        >
                          Excluir
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
