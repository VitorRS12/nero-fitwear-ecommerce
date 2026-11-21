import { queryOptions } from "@tanstack/react-query";
import { adminGetOrderDetail, adminListKanban } from "@/lib/admin-orders.functions";

export const adminKanbanQuery = () =>
  queryOptions({ queryKey: ["admin", "kanban"], queryFn: () => adminListKanban(), refetchInterval: 60_000 });

export const adminOrderDetailQuery = (orderId: string) =>
  queryOptions({ queryKey: ["admin", "order", orderId], queryFn: () => adminGetOrderDetail({ data: { orderId } }) });
