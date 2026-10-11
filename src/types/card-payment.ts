export interface CardFormData {
  token: string;
  payment_method_id: string;
  issuer_id?: string | number | undefined;
  installments: number;
  payer: { email: string; identification?: { type: string; number: string } };
}

export interface CardOrder {
  id: string;
  orderNumber: string;
  total: number;
  paymentStatus: "pending" | "approved" | "rejected" | "cancelled" | "refunded";
  paymentId: string | null;
  statusDetail: string | null;
  challenge: { externalResourceURL: string; creq: string } | null;
}

export interface BrickController { unmount: () => void | Promise<void> }
export interface MercadoPagoBrowser {
  bricks: () => {
    create: (name: "cardPayment" | "statusScreen", container: string, settings: Record<string, unknown>) => Promise<BrickController>;
  };
}