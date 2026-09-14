import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { isAdminQuery } from "@/services/admin-product.service";

interface AdminShellProps {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}

/** Moldura da área restrita: cabeçalho simples e verificação de permissão. */
export function AdminShell({ title, action, children }: AdminShellProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: isAdmin, isLoading } = useQuery(isAdminQuery());

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container-nero flex flex-wrap items-center gap-4 py-4">
          <Link to="/" className="font-display text-2xl tracking-wide">
            NERO
          </Link>
          <span className="label-caps text-muted-foreground">Área restrita</span>
          <nav className="ml-auto flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="label-caps">
              <Link to="/admin/produtos">Peças</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="label-caps">
              <Link to="/admin/categorias">Categorias</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="label-caps">
              <Link to="/admin/tela-inicial">Tela inicial</Link>
            </Button>
            <Button variant="outline" size="sm" className="label-caps" onClick={signOut}>
              Sair
            </Button>
          </nav>
        </div>
      </header>

      <main className="container-nero py-8">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : !isAdmin ? (
          <div className="max-w-md space-y-3">
            <h1 className="text-3xl">Sem permissão</h1>
            <p className="text-sm text-muted-foreground">
              Esta conta não tem acesso à área restrita.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <h1 className="text-4xl">{title}</h1>
              {action}
            </div>
            {children}
          </>
        )}
      </main>
    </div>
  );
}
