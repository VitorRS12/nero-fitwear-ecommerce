import { queryOptions } from "@tanstack/react-query";
import { adminListInventory } from "@/lib/admin-inventory.functions";

export const adminInventoryQuery = () =>
  queryOptions({ queryKey: ["admin", "inventory"], queryFn: () => adminListInventory() });
