import { useDraggable } from "@dnd-kit/core";
import { motion, useAnimationControls } from "framer-motion";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import type { KanbanCard } from "@/lib/admin-orders.functions";
import { isLate, nextStage, STAGE_LABEL } from "@/lib/fulfillment-rules";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

const dateTime = (v: string) =>
  new Date(v).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

/** Código de rastreio que "digita" quando acaba de ser registrado. */
function TypedCode({ code, animate }: { code: string; animate: boolean }) {
  const [shown, setShown] = useState(animate ? "" : code);
  useEffect(() => {
    if (!animate) return setShown(code);
    let i = 0;
    const t = setInterval(() => { i += 1; setShown(code.slice(0, i)); if (i >= code.length) clearInterval(t); }, 55);
    return () => clearInterval(t);
  }, [code, animate]);
  return <span className="font-mono tracking-wider">{shown}<span className={cn(shown.length < code.length && "animate-pulse")}>{shown.length < code.length ? "▍" : ""}</span></span>;
}

export function DoneCheck({ play }: { play: boolean }) {
  return (
    <motion.span className="relative inline-flex h-6 w-6 items-center justify-center rounded-full border border-foreground"
      initial={play ? { scale: 0.6, opacity: 0 } : false} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 380, damping: 18 }}>
      {play ? <motion.span className="absolute inset-0 rounded-full border border-foreground"
        initial={{ scale: 1, opacity: 0.8 }} animate={{ scale: 2.2, opacity: 0 }} transition={{ duration: 0.9, ease: "easeOut" }} /> : null}
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
        <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={play ? { pathLength: 0 } : false} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.15 }} />
      </svg>
    </motion.span>
  );
}

interface Props {
  card: KanbanCard;
  shakeKey: number;
  celebrate: boolean;
  onOpen: () => void;
  onAdvance: () => void;
  overlay?: boolean;
}

export function OrderCardView({ card, shakeKey, celebrate, onOpen, onAdvance, overlay }: Props) {
  const controls = useAnimationControls();
  useEffect(() => {
    if (shakeKey) void controls.start({ x: [0, -10, 10, -7, 7, -3, 0], transition: { duration: 0.45 } });
  }, [shakeKey, controls]);

  const late = isLate(card.stage, card.stageEnteredAt);
  const next = nextStage(card.stage);
  const done = card.stage === "shipped";

  return (
    <motion.article animate={controls}
      className={cn("group relative select-none border bg-card p-4 text-left transition-colors",
        overlay ? "rotate-2 scale-[1.03] cursor-grabbing border-foreground" : "border-border hover:border-muted-foreground",
        done && "bg-secondary")}>
      <div className="flex items-start justify-between gap-2">
        <button type="button" onClick={onOpen} className="text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
          <p className="label-caps text-muted-foreground">{card.orderNumber}</p>
          <p className="mt-1 font-medium leading-tight">{card.customerName}</p>
        </button>
        {done ? <DoneCheck play={celebrate} /> : null}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        {card.itemCount} {card.itemCount === 1 ? "peça" : "peças"} · {formatCurrency(card.total)}
      </p>
      <p className="text-xs text-muted-foreground">Recebido {dateTime(card.receivedAt)}</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {card.priority ? <span className="label-caps border border-foreground px-1.5 py-0.5 text-[10px]">Prioridade</span> : null}
        {late ? <span className="label-caps bg-foreground px-1.5 py-0.5 text-[10px] text-background">Atrasado</span> : null}
        {card.isPickup ? <span className="label-caps border border-border px-1.5 py-0.5 text-[10px]">Retirada</span> : null}
        {card.paymentStatus !== "approved" ? <span className="label-caps border border-dashed border-foreground px-1.5 py-0.5 text-[10px]">Pagamento: {card.paymentStatus}</span> : null}
        {card.hasNotes ? <span className="label-caps border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">Obs.</span> : null}
      </div>

      {card.trackingCode ? (
        <motion.div className="mt-3 border-t border-border pt-2 text-xs" initial={celebrate ? { opacity: 0, y: 6 } : false} animate={{ opacity: 1, y: 0 }}>
          <div className="relative inline-block label-caps text-[10px] text-muted-foreground">
            Rastreio registrado
            <motion.span className="absolute -bottom-0.5 left-0 h-px bg-foreground"
              initial={celebrate ? { width: 0 } : { width: "100%" }} animate={{ width: "100%" }} transition={{ duration: 0.6, delay: 0.9 }} />
          </div>
          <p className="mt-1"><TypedCode code={card.trackingCode} animate={celebrate} /></p>
        </motion.div>
      ) : done && card.isPickup ? (
        <p className="mt-3 border-t border-border pt-2 label-caps text-[10px] text-muted-foreground">Pronto para retirada</p>
      ) : null}

      {next && !overlay ? (
        <Button size="sm" variant="ghost" className="mt-2 h-7 w-full justify-between px-2 label-caps text-[10px]" onClick={onAdvance}>
          Avançar <span aria-hidden>→ {STAGE_LABEL[next]}</span>
        </Button>
      ) : null}
    </motion.article>
  );
}

export function DraggableOrderCard(props: Omit<Props, "overlay">) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: props.card.orderId, data: { card: props.card } });
  return (
    <motion.div layout layoutId={props.card.orderId} ref={setNodeRef} {...attributes} {...listeners}
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
      className={cn("cursor-grab touch-none", isDragging && "pointer-events-none")}>
      <div className={cn(isDragging && "invisible")} aria-hidden={isDragging || undefined}>
        <OrderCardView {...props} />
      </div>
    </motion.div>
  );
}
