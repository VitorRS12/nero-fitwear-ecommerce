import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { AdminShell } from "@/components/admin/AdminShell";
import { HomeMediaSlot } from "@/components/admin/HomeMediaSlot";
import { adminHomeMediaQuery, findSlot } from "@/services/home-media.service";

export const Route = createFileRoute("/_authenticated/admin/tela-inicial")({
  ssr: false,
  head: () => ({ meta: [{ title: "Tela inicial — NERO Fitwear" }] }),
  component: AdminHomePage,
});

function AdminHomePage() {
  const { data } = useQuery(adminHomeMediaQuery());

  return (
    <AdminShell title="Tela inicial">
      <div className="grid gap-6 lg:grid-cols-2">
        <HomeMediaSlot
          slot="hero"
          title="Capa do topo"
          hint="Aparece atrás do título grande, no topo da tela inicial."
          media={findSlot(data, "hero")}
        />
        <HomeMediaSlot
          slot="banner"
          title="Faixa promocional"
          hint="Aparece no meio da tela inicial, no bloco da coleção."
          media={findSlot(data, "banner")}
        />
      </div>
    </AdminShell>
  );
}
