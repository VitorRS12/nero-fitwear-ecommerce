import { Link } from "@tanstack/react-router";

import { Checkbox } from "@/components/ui/checkbox";

interface TermsConsentProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function TermsConsent({ checked, onChange }: TermsConsentProps) {
  return (
    <div className="flex items-start gap-3">
      <Checkbox
        id="accept-terms"
        checked={checked}
        onCheckedChange={(value) => onChange(value === true)}
        aria-required="true"
        className="mt-0.5"
      />
      <label htmlFor="accept-terms" className="text-xs leading-relaxed text-muted-foreground">
        Li e aceito os{" "}
        <Link to="/termos" target="_blank" className="underline hover:text-foreground">Termos de Uso</Link> e a{" "}
        <Link to="/privacidade" target="_blank" className="underline hover:text-foreground">Política de Privacidade</Link>,
        e autorizo o uso dos meus dados para criar a conta e processar pedidos, conforme a LGPD.
      </label>
    </div>
  );
}
