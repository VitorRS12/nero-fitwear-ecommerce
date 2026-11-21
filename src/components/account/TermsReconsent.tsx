import { useState } from "react";
import { toast } from "sonner";

import { TermsConsent } from "@/components/account/TermsConsent";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { buildTermsAcceptance } from "@/lib/legal";

/** Shown to signed-in users (e.g. Google/Apple sign-ups) who have not accepted the current terms. */
export function TermsReconsent({ onAccepted }: { onAccepted: () => void }) {
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const confirm = async () => {
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ data: buildTermsAcceptance() });
    setLoading(false);
    if (error) {
      toast.error("Não foi possível registrar o aceite. Tente novamente.");
      return;
    }
    onAccepted();
  };

  return (
    <div className="max-w-lg space-y-4 border border-border p-5">
      <p className="text-sm">Para continuar usando sua conta, aceite nossos termos atualizados.</p>
      <TermsConsent checked={accepted} onChange={setAccepted} />
      <Button className="label-caps" disabled={!accepted || loading} onClick={() => void confirm()}>
        {loading ? "Aguarde..." : "Aceitar e continuar"}
      </Button>
    </div>
  );
}
