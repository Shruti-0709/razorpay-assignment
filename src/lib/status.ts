import type {
  PaymentLink,
  PaymentLinkStatus,
  StatusFilterValue,
} from '../types/paymentLink';

export const STATUS_LABELS: Record<PaymentLinkStatus, string> = {
  active: 'Active',
  partially_paid: 'Partially paid',
  paid: 'Paid',
  expired: 'Expired',
};

export const STATUS_FILTERS: { value: StatusFilterValue; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: STATUS_LABELS.active },
  { value: 'partially_paid', label: STATUS_LABELS.partially_paid },
  { value: 'paid', label: STATUS_LABELS.paid },
  { value: 'expired', label: STATUS_LABELS.expired },
];

/**
 * Status is derived, never stored, so a link flips to Expired as soon as its
 * expiry passes. Precedence: Paid (never expires) > Expired > Partially paid > Active.
 */
export function getPaymentLinkStatus(
  link: Pick<PaymentLink, 'amountPaise' | 'amountPaidPaise' | 'expiresAt'>,
  now: Date,
): PaymentLinkStatus {
  if (link.amountPaidPaise >= link.amountPaise) return 'paid';
  if (link.expiresAt && new Date(link.expiresAt).getTime() <= now.getTime()) {
    return 'expired';
  }
  if (link.amountPaidPaise > 0) return 'partially_paid';
  return 'active';
}

export function filterPaymentLinks(
  links: PaymentLink[],
  filter: StatusFilterValue,
  now: Date,
): PaymentLink[] {
  if (filter === 'all') return links;
  return links.filter((link) => getPaymentLinkStatus(link, now) === filter);
}

export function countByStatus(
  links: PaymentLink[],
  now: Date,
): Record<StatusFilterValue, number> {
  const counts: Record<StatusFilterValue, number> = {
    all: links.length,
    active: 0,
    partially_paid: 0,
    paid: 0,
    expired: 0,
  };
  for (const link of links) counts[getPaymentLinkStatus(link, now)] += 1;
  return counts;
}
