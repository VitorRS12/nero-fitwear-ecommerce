import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Digite um e-mail válido.");
      return;
    }
    setIsSubmitting(true);
    // Integração com e-mail transacional será conectada na fase de notificações.
    setTimeout(() => {
      setIsSubmitting(false);
      setEmail("");
      toast.success("Pronto! Você vai receber os próximos lançamentos.");
    }, 400);
  };

  return (
    <section className="border-t border-border py-16">
      <div className="container-nero grid gap-8 lg:grid-cols-2 lg:items-center">
        <div className="space-y-3">
          <p className="label-caps text-accent">Newsletter</p>
          <h2 className="text-4xl sm:text-5xl">Entre para a lista</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Lançamentos, drops limitados e condições exclusivas direto no seu e-mail.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
          <label htmlFor="newsletter-email" className="sr-only">
            Seu e-mail
          </label>
          <Input
            id="newsletter-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-12"
          />
          <Button type="submit" size="lg" className="label-caps" disabled={isSubmitting}>
            {isSubmitting ? "Enviando..." : "Quero receber"}
          </Button>
        </form>
      </div>
    </section>
  );
}
