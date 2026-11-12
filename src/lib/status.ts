import type {
  PaymentLink,
  PaymentLinkStatus,
  StatusFilterValue,
} from '../types/paymentLink';

export const STATUS_LABELS: Record<PaymentLinkStatus, string> = {
  active: 'Active',
  paid: 'Paid',
  expired: 'Expired',
};

export const STATUS_FILTERS: { value: StatusFilterValue; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: STATUS_LABELS.active },
  { value: 'paid', label: STATUS_LABELS.paid },
  { value: 'expired', label: STATUS_LABELS.expired },
];

/**
 * Status is derived, never stored, so a link flips to Expired as soon as its
 * expiry passes. A paid link stays Paid even if its expiry later passes.
 */
export function getPaymentLinkStatus(
  link: Pick<PaymentLink, 'paidAt' | 'expiresAt'>,
  now: Date,
): PaymentLinkStatus {
  if (link.paidAt) return 'paid';
  if (link.expiresAt && new Date(link.expiresAt).getTime() <= now.getTime()) {
    return 'expired';
  }
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
    paid: 0,
    expired: 0,
  };
  for (const link of links) counts[getPaymentLinkStatus(link, now)] += 1;
  return counts;
}
