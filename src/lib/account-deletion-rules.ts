/** Orders in these states are still being processed, so the account cannot be deleted yet. */
export const BLOCKING_ORDER_STATUSES = ["paid", "preparing", "shipped"] as const;

export const DELETE_CONFIRMATION_WORD = "EXCLUIR";

export function isDeletionConfirmed(input: string): boolean {
  return input.trim().toUpperCase() === DELETE_CONFIRMATION_WORD;
}

export function canDeleteAccount(orderStatuses: readonly string[]): boolean {
  return !orderStatuses.some((status) => (BLOCKING_ORDER_STATUSES as readonly string[]).includes(status));
}
