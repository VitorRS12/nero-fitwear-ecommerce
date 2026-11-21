import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import { KanbanBoard } from "@/components/admin/orders/KanbanBoard";
import { OrderDetailSheet } from "@/components/admin/orders/OrderDetailSheet";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { isLate } from "@/lib/fulfillment-rules";
import { adminKanbanQuery } from "@/services/admin-orders.service";

export const Route = createFileRoute("/_authenticated/admin/pedidos")({
  head: () => ({
    meta: [
      { title: "Pedidos — NERO Fitwear" },
      { name: "description", content: "Painel Kanban de preparação e envio dos pedidos NERO Fitwear." },
      { property: "og:title", content: "Pedidos — NERO Fitwear" },
      { property: "og:description", content: "Painel Kanban de preparação e envio dos pedidos NERO Fitwear." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrdersPage,
});

function OrdersPage() {
  const { data, isLoading, error } = useQuery(adminKanbanQuery());
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [lateOnly, setLateOnly] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const cards = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data ?? []).filter((c) => {
      if (term && ![c.orderNumber, c.customerName, c.customerEmail].some((v) => v.toLowerCase().includes(term))) return false;
      const day = c.receivedAt.slice(0, 10);
      if (from && day < from) return false;
      if (to && day > to) return false;
      if (lateOnly && !isLate(c.stage, c.stageEnteredAt)) return false;
      return true;
    });
  }, [data, search, from, to, lateOnly]);

  return (
    <AdminShell title="Pedidos">
      <div className="mb-6 grid gap-3 border border-border p-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_auto] lg:items-end">
        <label className="space-y-1 text-xs text-muted-foreground">Buscar
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Número, nome ou e-mail" />
        </label>
        <label className="space-y-1 text-xs text-muted-foreground">De
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label className="space-y-1 text-xs text-muted-foreground">Até
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
        <label className="flex items-center gap-2 pb-2 text-sm"><Switch checked={lateOnly} onCheckedChange={setLateOnly} /> Só atrasados</label>
      </div>
      {error ? <p className="text-sm text-muted-foreground">{error instanceof Error ? error.message : "Erro ao carregar."}</p>
        : isLoading ? <p className="text-sm text-muted-foreground">Carregando pedidos…</p>
        : <KanbanBoard cards={cards} onOpen={setOpenId} />}
      <p className="mt-4 text-xs text-muted-foreground">Arraste o cartão livremente entre Pendentes, Em preparação e Aguardando envio. Enviados exige código de rastreio e não volta atrás.</p>
      <OrderDetailSheet orderId={openId} onClose={() => setOpenId(null)} />
    </AdminShell>
  );
}
