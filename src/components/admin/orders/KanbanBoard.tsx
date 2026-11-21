import {
  DndContext, DragOverlay, KeyboardSensor, PointerSensor, TouchSensor, useDroppable, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent,
} from "@dnd-kit/core";
import { AnimatePresence, MotionConfig } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { adminMoveOrder, type KanbanCard } from "@/lib/admin-orders.functions";
import { canMove, FULFILLMENT_STAGES, STAGE_LABEL, type FulfillmentStage } from "@/lib/fulfillment-rules";
import { cn } from "@/lib/utils";
import { DraggableOrderCard, OrderCardView } from "./OrderCard";
import { TrackingDialog } from "./TrackingDialog";

const HINT: Record<FulfillmentStage, string> = {
  pending: "Pagos, aguardando separação",
  preparing: "Separação e embalagem",
  awaiting_shipment: "Prontos para postagem/retirada",
  shipped: "Despachados ou entregues na loja",
};

function Column({ stage, cards, activeStage, children }: { stage: FulfillmentStage; cards: number; activeStage: FulfillmentStage | null; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const allowed = activeStage ? canMove(activeStage, stage, { isPickup: true }).ok : false;
  return (
    <section ref={setNodeRef} aria-label={STAGE_LABEL[stage]}
      className={cn("flex min-h-[60vh] w-full flex-col border bg-background p-3 transition-colors duration-200 md:w-auto",
        isOver && allowed ? "border-foreground bg-secondary" : isOver ? "border-dashed border-muted-foreground" : allowed ? "border-muted-foreground" : "border-border")}>
      <header className="mb-3 flex items-baseline justify-between border-b border-border pb-2">
        <div>
          <h2 className="label-caps">{STAGE_LABEL[stage]}</h2>
          <p className="text-xs text-muted-foreground">{HINT[stage]}</p>
        </div>
        <span className="font-display text-xl">{cards}</span>
      </header>
      <div className="flex flex-1 flex-col gap-3">{children}</div>
    </section>
  );
}

export function KanbanBoard({ cards, onOpen }: { cards: KanbanCard[]; onOpen: (id: string) => void }) {
  const qc = useQueryClient();
  const move = useServerFn(adminMoveOrder);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor),
  );
  const [active, setActive] = useState<KanbanCard | null>(null);
  const [shake, setShake] = useState<Record<string, number>>({});
  const [celebrate, setCelebrate] = useState<Set<string>>(new Set());
  const [pendingShip, setPendingShip] = useState<KanbanCard | null>(null);
  const [busy, setBusy] = useState(false);
  const [mobileStage, setMobileStage] = useState<FulfillmentStage>("pending");

  const bump = (id: string) => setShake((s) => ({ ...s, [id]: (s[id] ?? 0) + 1 }));

  async function commit(card: KanbanCard, to: FulfillmentStage, trackingCode?: string) {
    const key = ["admin", "kanban"];
    const prev = qc.getQueryData<KanbanCard[]>(key);
    const now = new Date().toISOString();
    qc.setQueryData<KanbanCard[]>(key, (old) => old?.map((c) => c.orderId === card.orderId
      ? { ...c, stage: to, stageEnteredAt: now, trackingCode: trackingCode ?? c.trackingCode } : c));
    if (to === "shipped") setCelebrate((s) => new Set(s).add(card.orderId));
    try {
      const res = await move({ data: { orderId: card.orderId, to, trackingCode } });
      toast.success(to === "shipped" ? (res.emailSent ? "Concluído. Cliente avisado por e-mail." : "Concluído. O e-mail ao cliente não foi enviado.") : `Movido para ${STAGE_LABEL[to]}.`);
      void qc.invalidateQueries({ queryKey: ["admin", "order", card.orderId] });
      return true;
    } catch (e) {
      qc.setQueryData(key, prev);
      setCelebrate((s) => { const n = new Set(s); n.delete(card.orderId); return n; });
      bump(card.orderId);
      toast.error(e instanceof Error ? e.message : "Não foi possível mover.");
      return false;
    } finally { void qc.invalidateQueries({ queryKey: key }); }
  }

  function attempt(card: KanbanCard, to: FulfillmentStage) {
    if (to === card.stage) return;
    const check = canMove(card.stage, to, { isPickup: true });
    if (!check.ok) { bump(card.orderId); toast.error("O pedido só pode avançar uma etapa por vez."); return; }
    if (to === "shipped") { setPendingShip(card); return; }
    void commit(card, to);
  }

  const onDragStart = (e: DragStartEvent) => setActive((e.active.data.current?.["card"] as KanbanCard) ?? null);
  const onDragEnd = (e: DragEndEvent) => {
    const card = e.active.data.current?.["card"] as KanbanCard | undefined;
    setActive(null);
    if (card && e.over) attempt(card, e.over.id as FulfillmentStage);
  };

  const byStage = (s: FulfillmentStage) => cards.filter((c) => c.stage === s)
    .sort((a, b) => Number(b.priority) - Number(a.priority) || a.receivedAt.localeCompare(b.receivedAt));

  return (
    <MotionConfig reducedMotion="user">
      <div className="mb-4 flex gap-1 overflow-x-auto md:hidden" role="tablist">
        {FULFILLMENT_STAGES.map((s) => (
          <button key={s} role="tab" aria-selected={mobileStage === s} onClick={() => setMobileStage(s)}
            className={cn("label-caps shrink-0 border px-3 py-2 text-[11px] transition-colors",
              mobileStage === s ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground")}>
            {STAGE_LABEL[s]} · {byStage(s).length}
          </button>
        ))}
      </div>
      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setActive(null)}>
        <div className="grid gap-3 md:grid-cols-4">
          {FULFILLMENT_STAGES.map((s) => {
            const list = byStage(s);
            return (
              <div key={s} className={cn(mobileStage !== s && "hidden md:block")}>
                <Column stage={s} cards={list.length} activeStage={active?.stage ?? null}>
                  <AnimatePresence initial={false}>
                    {list.map((c) => (
                      <DraggableOrderCard key={c.orderId} card={c} shakeKey={shake[c.orderId] ?? 0}
                        celebrate={celebrate.has(c.orderId)} onOpen={() => onOpen(c.orderId)}
                        onAdvance={() => { const i = FULFILLMENT_STAGES.indexOf(c.stage); const to = FULFILLMENT_STAGES[i + 1]; if (to) { attempt(c, to); setMobileStage(to); } }} />
                    ))}
                  </AnimatePresence>
                  {list.length === 0 ? <p className="py-8 text-center text-xs text-muted-foreground">Nenhum pedido aqui.</p> : null}
                </Column>
              </div>
            );
          })}
        </div>
        <DragOverlay dropAnimation={null}>
          {active ? <OrderCardView card={active} shakeKey={0} celebrate={false} onOpen={() => {}} onAdvance={() => {}} overlay /> : null}
        </DragOverlay>
      </DndContext>
      <TrackingDialog open={!!pendingShip} orderNumber={pendingShip?.orderNumber ?? ""} isPickup={!!pendingShip?.isPickup} busy={busy}
        onCancel={() => { if (pendingShip) bump(pendingShip.orderId); setPendingShip(null); }}
        onConfirm={async (code) => {
          if (!pendingShip) return;
          setBusy(true);
          const card = pendingShip;
          setPendingShip(null);
          await commit(card, "shipped", code);
          setBusy(false);
        }} />
    </MotionConfig>
  );
}
