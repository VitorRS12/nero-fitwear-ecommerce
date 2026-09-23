import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, Search, ShoppingBag, User } from "lucide-react";
import { useState } from "react";

import { BrandMark } from "@/components/shared/BrandMark";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useCart } from "@/providers/cart-provider";
import type { Category } from "@/types/catalog";

interface HeaderProps {
  categories: Category[];
}

export function Header({ categories }: HeaderProps) {
  const { totals, isHydrated } = useCart();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [ searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const navLinks = (
    <>
      <Link
        to="/catalogo"
        className="label-caps py-2 transition-colors hover:text-accent"
        activeProps={{ className: "text-accent" }}
        onClick={() => setOpen(false)}
      >
        Todos
      </Link>
      {categories.map((category) => (
        <Link
          key={category.id}
          to="/catalogo/$categoria"
          params={{ categoria: category.slug }}
          className="label-caps py-2 transition-colors hover:text-accent"
          activeProps={{ className: "text-accent" }}
          onClick={() => setOpen(false)}
        >
          {category.name}
        </Link>
      ))}
    </>
  );

  const submitSearch = (event: React.FormEvent) => {
  event.preventDefault();
  const busca = searchTerm.trim();
  setSearchOpen(false);
  void navigate({
    to: "/catalogo",
    search: busca ? { busca } : {},
  });
};

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className="container-nero flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-background">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <nav className="mt-8 flex flex-col gap-1" aria-label="Categorias">
                {navLinks}
              </nav>
            </SheetContent>
          </Sheet>

          <Link to="/" aria-label="NERO Fitwear — início">
            <BrandMark />
          </Link>
        </div>

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Categorias">
          {navLinks}
        </nav>

        <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" asChild aria-label="Buscar produtos">
            <Link to="/catalogo" search={{ busca: "" }}>
              <Search className="size-5" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild aria-label="Minha conta">
            <Link to="/conta">
              <User className="size-5" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild aria-label="Carrinho" className="relative">
            <Link to="/carrinho">
              <ShoppingBag className="size-5" />
              {isHydrated && totals.itemCount > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                  {totals.itemCount}
                </span>
              ) : null}
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
