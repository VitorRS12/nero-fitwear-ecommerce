import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { adminUpdateOrderOps } from "@/lib/admin-orders.functions";
import { STAGE_LABEL } from "@/lib/fulfillment-rules";
import { formatCurrency } from "@/lib/format";
import { adminOrderDetailQuery } from "@/services/admin-orders.service";

const PAYMENT_LABEL: Record<string, string> = {
  approved: "Aprovado", pending: "Pendente", rejected: "Recusado", cancelled: "Cancelado",
  refunded: "Reembolsado", in_mediation: "Em disputa", charged_back: "Estornado",
};
const dt = (v: string) => new Date(v).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="border-t border-border py-4"><h3 className="label-caps mb-2 text-muted-foreground">{title}</h3>{children}</section>;
}

export function OrderDetailSheet({ orderId, onClose }: { orderId: string | null; onClose: () => void }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ ...adminOrderDetailQuery(orderId ?? ""), enabled: !!orderId });
  const save = useServerFn(adminUpdateOrderOps);
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (data?.fulfillment) { setNotes(data.fulfillment.notes); setPriority(data.fulfillment.priority); }
  }, [data]);

  const a = data?.address as { recipient?: string; street?: string; number?: string; complement?: string; neighborhood?: string; city?: string; state?: string; zip_code?: string } | null | undefined;
  const pickup = data?.shippingMethod === "pickup";

  async function onSave() {
    if (!orderId) return;
    setSaving(true);
    try {
      await save({ data: { orderId, notes, priority } });
      toast.success("Observações salvas.");
      await Promise.all([qc.invalidateQueries({ queryKey: ["admin", "kanban"] }), qc.invalidateQueries({ queryKey: ["admin", "order", orderId] })]);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro ao salvar."); }
    finally { setSaving(false); }
  }

  return (
    <Sheet open={!!orderId} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl tracking-wide">{data?.orderNumber ?? "Pedido"}</SheetTitle>
          <SheetDescription>
            {data ? `Recebido ${dt(data.createdAt)} · ${data.fulfillment ? STAGE_LABEL[data.fulfillment.status] : "—"} · Pagamento ${PAYMENT_LABEL[data.paymentStatus] ?? data.paymentStatus}` : "Carregando…"}
          </SheetDescription>
        </SheetHeader>
        {isLoading || !data ? <p className="py-6 text-sm text-muted-foreground">Carregando detalhes…</p> : (
          <div className="mt-4 text-sm">
            <Section title="Comprador">
              <p className="font-medium">{data.customer.name}</p>
              <p className="text-muted-foreground">{data.customer.email}</p>
              {data.customer.phone ? <p className="text-muted-foreground">{data.customer.phone}</p> : null}
            </Section>
            <Section title={pickup ? "Entrega · Retirada no local" : "Endereço de entrega"}>
              {pickup || !a ? <p className="text-muted-foreground">Cliente retira na loja.</p> : (
                <p className="leading-relaxed">{a.recipient}<br />{a.street}, {a.number}{a.complement ? ` — ${a.complement}` : ""}<br />
                  {a.neighborhood} · {a.city}/{a.state}<br />CEP {a.zip_code}</p>
              )}
              {data.fulfillment?.trackingCode ? (
                <p className="mt-2">{data.fulfillment.carrier ?? "Correios"} · <span className="font-mono">{data.fulfillment.trackingCode}</span></p>
              ) : null}
            </Section>
            <Section title={`Produtos (${data.items.length})`}>
              <ul className="space-y-2">
                {data.items.map((i) => (
                  <li key={i.id} className="flex justify-between gap-3">
                    <span>{i.product_name}<span className="block text-xs text-muted-foreground">{[i.color, i.size, i.sku].filter(Boolean).join(" · ")} · Qtd {i.quantity} × {formatCurrency(i.unit_price)}</span></span>
                    <span>{formatCurrency(i.total)}</span>
                  </li>
                ))}
              </ul>
            </Section>
            <Section title="Resumo financeiro">
              <dl className="space-y-1">
                <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatCurrency(data.subtotal)}</dd></div>
                {data.discount ? <div className="flex justify-between"><dt>Desconto</dt><dd>−{formatCurrency(data.discount)}</dd></div> : null}
                <div className="flex justify-between"><dt>Frete</dt><dd>{formatCurrency(data.shippingCost)}</dd></div>
                <div className="flex justify-between border-t border-border pt-1 font-medium"><dt>Total</dt><dd>{formatCurrency(data.total)}</dd></div>
              </dl>
            </Section>
            <Section title="Histórico">
              <ol className="relative ml-1 space-y-3 border-l border-border pl-4">
                <li><span className="absolute -left-[3px] mt-1.5 h-1.5 w-1.5 rounded-full bg-foreground" />Pedido recebido e pago<span className="block text-xs text-muted-foreground">{dt(data.createdAt)}</span></li>
                {data.events.map((e) => (
                  <li key={e.id}>
                    <span className="absolute -left-[3px] mt-1.5 h-1.5 w-1.5 rounded-full bg-foreground" />
                    {STAGE_LABEL[e.toStatus]}
                    <span className="block text-xs text-muted-foreground">{dt(e.createdAt)} · {e.actor}{e.note ? ` · ${e.note}` : ""}</span>
                  </li>
                ))}
              </ol>
            </Section>
            <Section title="Observações internas (o cliente não vê)">
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} maxLength={2000} placeholder="Ex.: embalagem especial, conferir endereço…" />
              <label className="mt-3 flex items-center gap-2"><Switch checked={priority} onCheckedChange={setPriority} /> Marcar como prioridade</label>
              <Button className="mt-3" size="sm" onClick={onSave} disabled={saving}>{saving ? "Salvando…" : "Salvar"}</Button>
            </Section>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
