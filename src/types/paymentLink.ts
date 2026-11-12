export type PaymentLinkStatus = 'active' | 'paid' | 'expired';

export type StatusFilterValue = PaymentLinkStatus | 'all';

export interface PaymentLinkCustomer {
  email: string | null;
  phone: string | null;
}

export interface PaymentLink {
  id: string;
  /** Amount in paise (integer) to avoid floating-point rounding. */
  amountPaise: number;
  description: string;
  customer: PaymentLinkCustomer;
  /** ISO 8601 timestamps. */
  createdAt: string;
  expiresAt: string | null;
  paidAt: string | null;
}

export interface CreatePaymentLinkInput {
  amountPaise: number;
  description: string;
  customer: PaymentLinkCustomer;
  expiresAt: string | null;
}
