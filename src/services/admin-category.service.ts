import { queryOptions } from "@tanstack/react-query";

import { adminListCategories } from "@/lib/admin-catalog.functions";

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  position: number;
  is_active: boolean;
}

export const adminCategoriesQuery = () =>
  queryOptions({
    queryKey: ["admin", "categories"],
    queryFn: async () => (await adminListCategories()) as unknown as AdminCategory[],
    staleTime: 10 * 1000,
  });
