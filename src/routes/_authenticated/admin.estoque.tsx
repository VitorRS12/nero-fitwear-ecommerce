import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin/AdminShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  adminAdjustStock, adminSetLowStockThreshold, type InventoryRow,
} from "@/lib/admin-inventory.functions";
import { nextStock, stockLevel } from "@/lib/inventory-rules";
import { adminInventoryQuery } from "@/services/admin-inventory.service";

export const Route = createFileRoute("/_authenticated/admin/estoque")({
  head: () => ({
    meta: [
      { title: "Estoque — NERO Fitwear" },
      { name: "description", content: "Controle de estoque das peças da NERO Fitwear." },
      { property: "og:title", content: "Estoque — NERO Fitwear" },
      { property: "og:description", content: "Controle de estoque das peças da NERO Fitwear." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: InventoryPage,
});

type Filter = "all" | "low" | "out";
const LEVEL_LABEL = { out: "Esgotado", low: "Estoque baixo", ok: "Normal" } as const;

function InventoryPage() {
  const { data: rows, isLoading } = useQuery(adminInventoryQuery());
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [editing, setEditing] = useState<InventoryRow | null>(null);

  const all = rows ?? [];
  const lowCount = all.filter((r) => r.isActive && stockLevel(r.stock, r.threshold) === "low").length;
  const outCount = all.filter((r) => r.isActive && stockLevel(r.stock, r.threshold) === "out").length;

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return all.filter((r) => {
      const level = stockLevel(r.stock, r.threshold);
      if (filter !== "all" && level !== filter) return false;
      if (!term) return true;
      return [r.productName, r.sku, r.color, r.size].some((v) => v?.toLowerCase().includes(term));
    });
  }, [all, search, filter]);

  return (
    <AdminShell title="Estoque">
      {(lowCount > 0 || outCount > 0) && (
        <div role="status" className="mb-6 border border-border bg-card p-4 text-sm">
          <span className="label-caps">Atenção:</span>{" "}
          {outCount} peça(s) esgotada(s) e {lowCount} com estoque baixo.
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        <Input
          aria-label="Buscar peça"
          placeholder="Buscar por nome, código, cor ou tamanho"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        {(["all", "low", "out"] as const).map((f) => (
          <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
            {f === "all" ? "Todas" : f === "low" ? `Baixo (${lowCount})` : `Esgotado (${outCount})`}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (
        <div className="overflow-x-auto border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-muted-foreground">
              <tr>
                <th className="p-3">Peça</th>
                <th className="p-3">Cor / Tam.</th>
                <th className="p-3 text-right">Disponível</th>
                <th className="p-3 text-right">Em pedidos abertos</th>
                <th className="p-3 text-right">Alerta em</th>
                <th className="p-3">Situação</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const level = stockLevel(r.stock, r.threshold);
                return (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className="p-3">
                      <div>{r.productName}</div>
                      <div className="text-xs text-muted-foreground">{r.sku}</div>
                    </td>
                    <td className="p-3">{[r.color, r.size].filter(Boolean).join(" / ") || "—"}</td>
                    <td className="p-3 text-right tabular-nums">{r.stock}</td>
                    <td className="p-3 text-right tabular-nums">{r.reservedInOrders}</td>
                    <td className="p-3 text-right tabular-nums">{r.threshold}</td>
                    <td className="p-3">
                      <Badge variant={level === "ok" ? "outline" : level === "low" ? "secondary" : "default"}>
                        {r.isActive ? LEVEL_LABEL[level] : "Inativa"}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      <Button size="sm" variant="outline" onClick={() => setEditing(r)}>
                        Movimentar
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-muted-foreground">Nenhuma peça encontrada.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <AdjustDialog row={editing} onClose={() => setEditing(null)} />
    </AdminShell>
  );
}

function AdjustDialog({ row, onClose }: { row: InventoryRow | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const adjust = useServerFn(adminAdjustStock);
  const saveThreshold = useServerFn(adminSetLowStockThreshold);
  const [mode, setMode] = useState<"add" | "set">("add");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const [threshold, setThreshold] = useState("");
  const [busy, setBusy] = useState(false);

  const reset = () => { setMode("add"); setQuantity(""); setNote(""); setThreshold(""); };
  const close = () => { reset(); onClose(); };

  if (!row) return null;
  const qty = Number.parseInt(quantity, 10);
  const preview = Number.isFinite(qty) && qty >= 0 ? nextStock(row.stock, mode, qty) : null;

  const submit = async () => {
    setBusy(true);
    try {
      const thr = threshold === "" ? null : Number.parseInt(threshold, 10);
      if (thr !== null && thr !== row.threshold) {
        await saveThreshold({ data: { variantId: row.id, threshold: thr } });
      }
      if (quantity !== "") {
        await adjust({ data: { variantId: row.id, mode, quantity: qty, note: note || (mode === "add" ? "Entrada de mercadoria" : "") } });
      }
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Estoque atualizado.");
      close();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível atualizar.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && close()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {row.productName} · {[row.color, row.size].filter(Boolean).join(" / ")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Disponível agora: {row.stock}</p>
          <div className="flex gap-2">
            <Button size="sm" variant={mode === "add" ? "default" : "outline"} onClick={() => setMode("add")}>
              Entrada
            </Button>
            <Button size="sm" variant={mode === "set" ? "default" : "outline"} onClick={() => setMode("set")}>
              Corrigir contagem
            </Button>
          </div>
          <div className="space-y-1">
            <Label htmlFor="qty">{mode === "add" ? "Quantas peças chegaram" : "Quantidade real contada"}</Label>
            <Input id="qty" type="number" min={0} inputMode="numeric" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            {preview !== null && <p className="text-xs text-muted-foreground">Ficará com {preview} peça(s).</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="note">Motivo</Label>
            <Input id="note" maxLength={300} placeholder={mode === "add" ? "Entrada de mercadoria" : "Ex.: contagem do inventário"} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="thr">Avisar quando chegar a</Label>
            <Input id="thr" type="number" min={0} inputMode="numeric" placeholder={String(row.threshold)} value={threshold} onChange={(e) => setThreshold(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={close}>Cancelar</Button>
          <Button
            onClick={submit}
            disabled={busy || (quantity === "" && threshold === "") || (mode === "set" && quantity !== "" && !note.trim())}
          >
            {busy ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
