import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/catalogo")({
  component: CatalogLayout,
});

function CatalogLayout() {
  return <Outlet />;
}
