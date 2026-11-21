import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { DELETE_CONFIRMATION_WORD, isDeletionConfirmed } from "@/lib/account-deletion-rules";
import { deleteMyAccount } from "@/lib/account.functions";

export function DeleteAccountCard() {
  const navigate = useNavigate();
  const deleteAccount = useServerFn(deleteMyAccount);
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const result = await deleteAccount({ data: { confirmation } });
      if (!result.ok) {
        toast.error(result.reason);
        return;
      }
      await supabase.auth.signOut();
      toast.success("Sua conta foi excluída.");
      void navigate({ to: "/", replace: true });
    } catch {
      toast.error("Não foi possível excluir a conta agora. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-12 max-w-lg border-t border-border pt-6">
      <h2 className="text-base font-medium">Excluir conta</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Apaga seu cadastro, endereços e avisos. Pedidos já feitos ficam guardados sem seus dados de contato,
        pelo prazo exigido pela lei fiscal. Não é possível desfazer.
      </p>
      <AlertDialog onOpenChange={() => setConfirmation("")}>
        <AlertDialogTrigger asChild>
          <Button variant="outline" className="label-caps mt-4">Excluir minha conta</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conta definitivamente?</AlertDialogTitle>
            <AlertDialogDescription>
              Digite {DELETE_CONFIRMATION_WORD} para confirmar. Você será desconectado em seguida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="delete-confirmation">Confirmação</Label>
            <Input
              id="delete-confirmation"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              autoComplete="off"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={loading || !isDeletionConfirmed(confirmation)}
              onClick={() => void handleDelete()}
            >
              {loading ? "Excluindo..." : "Excluir conta"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
