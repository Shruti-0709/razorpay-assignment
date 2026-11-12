import { describe, expect, it } from 'vitest';
import type { PaymentLink } from '../types/paymentLink';
import { countByStatus, filterPaymentLinks, getPaymentLinkStatus } from './status';

const NOW = new Date('2026-11-12T10:00:00Z');
const MINUTE = 60_000;
const iso = (offsetMs: number) => new Date(NOW.getTime() + offsetMs).toISOString();

function makeLink(id: string, overrides: Partial<PaymentLink> = {}): PaymentLink {
  return {
    id,
    amountPaise: 10_000,
    description: `Link ${id}`,
    customer: { email: 'a@example.com', phone: null },
    allowPartialPayments: true,
    minFirstPaymentPaise: null,
    amountPaidPaise: 0,
    payments: [],
    createdAt: iso(-60 * MINUTE),
    expiresAt: null,
    paidAt: null,
    ...overrides,
  };
}

const status = (overrides: Partial<PaymentLink>) => getPaymentLinkStatus(makeLink('x', overrides), NOW);

describe('getPaymentLinkStatus', () => {
  it('is Active when nothing is paid and there is no expiry', () => {
    expect(status({})).toBe('active');
  });

  it('is Active when nothing is paid and expiry is in the future', () => {
    expect(status({ expiresAt: iso(MINUTE) })).toBe('active');
  });

  it('is Partially paid when some but not all of the amount is paid', () => {
    expect(status({ amountPaidPaise: 1 })).toBe('partially_paid');
    expect(status({ amountPaidPaise: 9_999, expiresAt: iso(MINUTE) })).toBe('partially_paid');
  });

  it('is Paid when the full amount is paid', () => {
    expect(status({ amountPaidPaise: 10_000 })).toBe('paid');
  });

  it('is Expired once the expiry has passed, including exactly at expiry', () => {
    expect(status({ expiresAt: iso(-MINUTE) })).toBe('expired');
    expect(status({ expiresAt: iso(0) })).toBe('expired');
  });

  it('Expired wins over Partially paid once expiry passes', () => {
    expect(status({ amountPaidPaise: 5_000, expiresAt: iso(-MINUTE) })).toBe('expired');
  });

  it('Paid links never expire', () => {
    expect(status({ amountPaidPaise: 10_000, expiresAt: iso(-MINUTE) })).toBe('paid');
  });

  it('changes from Partially paid to Expired as time moves past the expiry', () => {
    const link = makeLink('x', { amountPaidPaise: 2_500, expiresAt: iso(5 * MINUTE) });
    expect(getPaymentLinkStatus(link, NOW)).toBe('partially_paid');
    expect(getPaymentLinkStatus(link, new Date(NOW.getTime() + 5 * MINUTE))).toBe('expired');
  });
});

describe('filterPaymentLinks / countByStatus', () => {
  const links = [
    makeLink('active-1'),
    makeLink('active-2', { expiresAt: iso(MINUTE) }),
    makeLink('partial', { amountPaidPaise: 4_000 }),
    makeLink('paid', { amountPaidPaise: 10_000 }),
    makeLink('expired', { expiresAt: iso(-MINUTE) }),
    makeLink('expired-partial', { amountPaidPaise: 4_000, expiresAt: iso(-MINUTE) }),
  ];
  const ids = (list: PaymentLink[]) => list.map((l) => l.id);

  it('filters by derived status and keeps order', () => {
    expect(ids(filterPaymentLinks(links, 'all', NOW))).toHaveLength(6);
    expect(ids(filterPaymentLinks(links, 'active', NOW))).toEqual(['active-1', 'active-2']);
    expect(ids(filterPaymentLinks(links, 'partially_paid', NOW))).toEqual(['partial']);
    expect(ids(filterPaymentLinks(links, 'paid', NOW))).toEqual(['paid']);
    expect(ids(filterPaymentLinks(links, 'expired', NOW))).toEqual(['expired', 'expired-partial']);
  });

  it('counts links per status', () => {
    expect(countByStatus(links, NOW)).toEqual({ all: 6, active: 2, partially_paid: 1, paid: 1, expired: 2 });
    expect(countByStatus([], NOW)).toEqual({ all: 0, active: 0, partially_paid: 0, paid: 0, expired: 0 });
  });
});
