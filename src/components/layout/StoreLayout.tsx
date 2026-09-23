import { useSuspenseQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { categoriesQuery } from "@/services/product.service";

/** Casca da loja: barra de avisos, cabeçalho, conteúdo e rodapé. */
export function StoreLayout({ children }: { children: ReactNode }) {
  const { data: categories } = useSuspenseQuery(categoriesQuery());

  return (
    <div className="flex min-h-screen flex-col">
      <AnnouncementBar />
      <Header categories={categories} />
      <main className="flex-1">{children}</main>
      <Footer categories={categories} />
    </div>
  );
}
