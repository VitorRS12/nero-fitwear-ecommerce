import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { TermsConsent } from "@/components/account/TermsConsent";
import { Section } from "@/components/blocks/Section";
import { StoreLayout } from "@/components/layout/StoreLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { buildTermsAcceptance } from "@/lib/legal";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — NERO Fitwear" },
      { name: "description", content: "Acesse sua conta NERO Fitwear." },
      { property: "og:title", content: "Entrar — NERO Fitwear" },
      { property: "og:description", content: "Acesse sua conta NERO Fitwear." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/auth" }],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const handleOAuth = async (provider: "google" | "apple") => {
    if (!acceptedTerms) {
      toast.error("Aceite os Termos de Uso e a Política de Privacidade para continuar.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/conta` },
    });
    if (error) {
      toast.error("Não foi possível entrar com essa conta. Tente novamente.");
      setLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Bem-vindo de volta.");
        void navigate({ to: "/conta" });
      } else {
        if (!acceptedTerms) throw new Error("Aceite os Termos de Uso e a Política de Privacidade para criar a conta.");
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name, ...buildTermsAcceptance() },
          },
        });
        if (error) throw error;
        toast.success("Conta criada. Já pode entrar.");
        setMode("login");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível continuar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <StoreLayout>
      <Section eyebrow="Conta" title={mode === "login" ? "Entrar" : "Criar conta"}>
        <div className="max-w-sm space-y-3">
          <div className="pb-2">
            <TermsConsent checked={acceptedTerms} onChange={setAcceptedTerms} />
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={loading || !acceptedTerms}
            onClick={() => void handleOAuth("google")}
            className="h-11 w-full gap-[10px] border-[#747775] bg-[#FFFFFF] px-3 text-sm font-medium text-[#1F1F1F] hover:bg-[#F2F2F2] hover:text-[#1F1F1F]"
          >
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
            Continue with Google
          </Button>
          <p className="py-2 text-center text-xs text-muted-foreground">ou com e-mail</p>
        </div>
        <form onSubmit={handleSubmit} className="max-w-sm space-y-4">
          {mode === "signup" ? (
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>
          <Button
            type="submit"
            className="label-caps w-full"
            disabled={loading || (mode === "signup" && !acceptedTerms)}
          >
            {loading ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
          </Button>
          <button
            type="button"
            className="text-xs text-muted-foreground underline"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
          >
            {mode === "login" ? "Não tenho conta" : "Já tenho conta"}
          </button>
        </form>
      </Section>
    </StoreLayout>
  );
}
