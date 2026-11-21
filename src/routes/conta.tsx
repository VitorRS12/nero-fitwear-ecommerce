import { useQuery, useQueryClient } from "@tanstack/react-query";
import { sendWelcomeEmailOnce } from "@/lib/account.functions";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { DeleteAccountCard } from "@/components/account/DeleteAccountCard";
import { TermsReconsent } from "@/components/account/TermsReconsent";
import { Section } from "@/components/blocks/Section";
import { StoreLayout } from "@/components/layout/StoreLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { hasAcceptedCurrentTerms } from "@/lib/legal";
import { isAdminQuery } from "@/services/admin-product.service";

export const Route = createFileRoute("/conta")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Minha conta — NERO Fitwear" },
      { name: "description", content: "Acompanhe seus pedidos, endereços e dados de cadastro." },
      { property: "og:title", content: "Minha conta — NERO Fitwear" },
      { property: "og:description", content: "Acompanhe seus pedidos NERO Fitwear." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { property: "og:url", content: "/conta" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/conta" }],
  }),
  component: AccountPage,
});

function AccountPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [termsOk, setTermsOk] = useState(true);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
      setTermsOk(!data.user || hasAcceptedCurrentTerms(data.user.user_metadata));
      setChecked(true);
      if (data.user) void sendWelcomeEmailOnce().catch(() => undefined);
    });
  }, []);

  const { data: isAdmin } = useQuery({ ...isAdminQuery(), enabled: Boolean(email) });

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    setEmail(null);
    void navigate({ to: "/auth", replace: true });
  };

  if (!checked) {
    return (
      <StoreLayout>
        <Section title="Minha conta">
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </Section>
      </StoreLayout>
    );
  }

  if (!email) {
    return (
      <StoreLayout>
        <Section eyebrow="Conta" title="Entrar">
          <p className="max-w-lg text-sm text-muted-foreground">
            Entre para acompanhar pedidos e endereços.
          </p>
          <div className="mt-6 flex gap-3">
            <Button asChild className="label-caps">
              <Link to="/auth">Entrar</Link>
            </Button>
            <Button asChild variant="outline" className="label-caps">
              <Link to="/catalogo">Ver produtos</Link>
            </Button>
          </div>
        </Section>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <Section eyebrow="Conta" title="Minha conta">
        <p className="text-sm text-muted-foreground">{email}</p>
        {!termsOk ? (
          <div className="mt-6">
            <TermsReconsent onAccepted={() => setTermsOk(true)} />
          </div>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-3">
          {isAdmin ? (
            <Button asChild className="label-caps">
              <Link to="/admin/produtos">Área restrita</Link>
            </Button>
          ) : null}
          <Button variant="outline" className="label-caps" onClick={signOut}>
            Sair
          </Button>
        </div>
        <p className="mt-8 max-w-lg text-sm text-muted-foreground">
          O histórico de pedidos e os endereços entram no ar junto com o checkout.
        </p>
        <DeleteAccountCard />
      </Section>
    </StoreLayout>
  );
}
