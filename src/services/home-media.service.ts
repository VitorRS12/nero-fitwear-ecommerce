import { queryOptions } from "@tanstack/react-query";

import { listHomeMedia } from "@/lib/catalog.functions";
import { adminListHomeMedia } from "@/lib/admin-catalog.functions";

export type HomeSlot = "hero" | "banner";

export interface HomeMedia {
  id: string;
  slot: HomeSlot;
  url: string;
  alt: string | null;
  is_active: boolean;
}

export const homeMediaQuery = () =>
  queryOptions({
    queryKey: ["home-media"],
    queryFn: async () => (await listHomeMedia()) as unknown as HomeMedia[],
    staleTime: 60 * 1000,
  });

export const adminHomeMediaQuery = () =>
  queryOptions({
    queryKey: ["admin", "home-media"],
    queryFn: async () => (await adminListHomeMedia()) as unknown as HomeMedia[],
    staleTime: 10 * 1000,
  });

export function findSlot(list: HomeMedia[] | undefined, slot: HomeSlot): HomeMedia | undefined {
  return list?.find((item) => item.slot === slot);
}
