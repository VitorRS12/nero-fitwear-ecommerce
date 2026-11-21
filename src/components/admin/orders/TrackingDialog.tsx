import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TRACKING_REGEX } from "@/lib/fulfillment-rules";

interface Props {
  open: boolean;
  orderNumber: string;
  isPickup: boolean;
  busy: boolean;
  onCancel: () => void;
  onConfirm: (trackingCode?: string) => void;
}

export function TrackingDialog({ open, orderNumber, isPickup, busy, onCancel, onConfirm }: Props) {
  const [code, setCode] = useState("");
  useEffect(() => { if (open) setCode(""); }, [open]);
  const normalized = code.trim().toUpperCase();
  const valid = TRACKING_REGEX.test(normalized);
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isPickup ? "Pronto para retirada" : "Registrar envio"}</DialogTitle>
          <DialogDescription>
            {isPickup
              ? `Confirme que o pedido ${orderNumber} está pronto. O cliente recebe um e-mail avisando.`
              : `Informe o código de rastreio dos Correios do pedido ${orderNumber}. O cliente recebe o código por e-mail.`}
          </DialogDescription>
        </DialogHeader>
        {!isPickup ? (
          <div className="space-y-2">
            <Label htmlFor="tracking">Código de rastreio</Label>
            <Input id="tracking" autoFocus placeholder="AB123456789BR" value={code} maxLength={13}
              onChange={(e) => setCode(e.target.value.toUpperCase())} className="font-mono tracking-wider" />
            {code && !valid ? <p className="text-xs text-muted-foreground">Formato: 2 letras, 9 números e 2 letras.</p> : null}
          </div>
        ) : null}
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={busy}>Cancelar</Button>
          <Button disabled={busy || (!isPickup && !valid)} onClick={() => onConfirm(isPickup ? undefined : normalized)}>
            {busy ? "Salvando…" : isPickup ? "Confirmar" : "Registrar envio"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
