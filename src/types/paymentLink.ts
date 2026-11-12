export type PaymentLinkStatus = 'active' | 'partially_paid' | 'paid' | 'expired';

export type StatusFilterValue = PaymentLinkStatus | 'all';

export interface PaymentLinkCustomer {
  email: string | null;
  phone: string | null;
}

export interface RecordedPayment {
  id: string;
  amountPaise: number;
  /** ISO 8601 timestamp. */
  recordedAt: string;
}

export interface PaymentLink {
  id: string;
  /** Amount in paise (integer) to avoid floating-point rounding. */
  amountPaise: number;
  description: string;
  customer: PaymentLinkCustomer;
  /** When false, a payment must settle the full amount due. */
  allowPartialPayments: boolean;
  /** Minimum for the first payment (paise); only set when partial payments are allowed. */
  minFirstPaymentPaise: number | null;
  /** Sum of `payments` (paise). */
  amountPaidPaise: number;
  payments: RecordedPayment[];
  /** ISO 8601 timestamps. */
  createdAt: string;
  expiresAt: string | null;
  /** Set when the link becomes fully paid. */
  paidAt: string | null;
}

export interface CreatePaymentLinkInput {
  amountPaise: number;
  description: string;
  customer: PaymentLinkCustomer;
  expiresAt: string | null;
  allowPartialPayments: boolean;
  minFirstPaymentPaise: number | null;
}
