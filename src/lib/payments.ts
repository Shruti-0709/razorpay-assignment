import type { PaymentLink } from '../types/paymentLink';
import { formatINR } from './format';
import { getPaymentLinkStatus } from './status';

type PaymentRules = Pick<
  PaymentLink,
  'amountPaise' | 'amountPaidPaise' | 'allowPartialPayments' | 'minFirstPaymentPaise'
>;

export function getAmountDuePaise(link: Pick<PaymentLink, 'amountPaise' | 'amountPaidPaise'>): number {
  return Math.max(link.amountPaise - link.amountPaidPaise, 0);
}

/** Only Active and Partially paid links accept payments. */
export function canRecordPayment(link: PaymentLink, now: Date): boolean {
  const status = getPaymentLinkStatus(link, now);
  return status === 'active' || status === 'partially_paid';
}

/** Minimum the next payment must be, in paise (first-payment minimum, capped at the amount due). */
export function getMinimumNextPaymentPaise(link: PaymentRules): number {
  const due = getAmountDuePaise(link);
  if (!link.allowPartialPayments) return due;
  if (link.amountPaidPaise === 0 && link.minFirstPaymentPaise) {
    return Math.min(link.minFirstPaymentPaise, due);
  }
  return 1;
}

/**
 * Business rules for recording a payment. Shared by the record-payment form
 * and the service, so the UI and the "server" can't disagree.
 */
export function getPaymentAmountError(link: PaymentRules, amountPaise: number): string | null {
  const due = getAmountDuePaise(link);
  if (!Number.isInteger(amountPaise) || amountPaise <= 0) return 'Payment must be greater than ₹0';
  if (amountPaise > due) return `Payment cannot exceed the amount due (${formatINR(due)})`;
  if (!link.allowPartialPayments && amountPaise !== due) {
    return `This link doesn't allow partial payments. Record the full amount due (${formatINR(due)})`;
  }
  const minimum = getMinimumNextPaymentPaise(link);
  if (amountPaise < minimum) return `First payment must be at least ${formatINR(minimum)}`;
  return null;
}

/** Returns a new link with the payment applied; marks it paid when fully settled. */
export function applyPayment(
  link: PaymentLink,
  payment: { id: string; amountPaise: number; recordedAt: Date },
): PaymentLink {
  const amountPaidPaise = link.amountPaidPaise + payment.amountPaise;
  const recordedAt = payment.recordedAt.toISOString();
  return {
    ...link,
    amountPaidPaise,
    payments: [...link.payments, { id: payment.id, amountPaise: payment.amountPaise, recordedAt }],
    paidAt: amountPaidPaise >= link.amountPaise ? recordedAt : link.paidAt,
  };
}
