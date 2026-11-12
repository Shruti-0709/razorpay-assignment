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
    createdAt: iso(-60 * MINUTE),
    expiresAt: null,
    paidAt: null,
    ...overrides,
  };
}

describe('getPaymentLinkStatus', () => {
  it('is Active when unpaid with no expiry', () => {
    expect(getPaymentLinkStatus({ paidAt: null, expiresAt: null }, NOW)).toBe('active');
  });

  it('is Active when unpaid and expiry is in the future', () => {
    expect(getPaymentLinkStatus({ paidAt: null, expiresAt: iso(MINUTE) }, NOW)).toBe('active');
  });

  it('is Expired once the expiry has passed, including exactly at expiry', () => {
    expect(getPaymentLinkStatus({ paidAt: null, expiresAt: iso(-MINUTE) }, NOW)).toBe('expired');
    expect(getPaymentLinkStatus({ paidAt: null, expiresAt: iso(0) }, NOW)).toBe('expired');
  });

  it('stays Paid even after the expiry passes', () => {
    expect(getPaymentLinkStatus({ paidAt: iso(-2 * MINUTE), expiresAt: iso(-MINUTE) }, NOW)).toBe('paid');
  });

  it('changes from Active to Expired as time moves past the expiry', () => {
    const link = { paidAt: null, expiresAt: iso(5 * MINUTE) };
    expect(getPaymentLinkStatus(link, NOW)).toBe('active');
    expect(getPaymentLinkStatus(link, new Date(NOW.getTime() + 5 * MINUTE))).toBe('expired');
  });
});

describe('filterPaymentLinks / countByStatus', () => {
  const links = [
    makeLink('active-1'),
    makeLink('active-2', { expiresAt: iso(MINUTE) }),
    makeLink('paid', { paidAt: iso(-MINUTE) }),
    makeLink('expired', { expiresAt: iso(-MINUTE) }),
  ];
  const ids = (list: PaymentLink[]) => list.map((l) => l.id);

  it('filters by derived status and keeps order', () => {
    expect(ids(filterPaymentLinks(links, 'all', NOW))).toEqual(['active-1', 'active-2', 'paid', 'expired']);
    expect(ids(filterPaymentLinks(links, 'active', NOW))).toEqual(['active-1', 'active-2']);
    expect(ids(filterPaymentLinks(links, 'paid', NOW))).toEqual(['paid']);
    expect(ids(filterPaymentLinks(links, 'expired', NOW))).toEqual(['expired']);
  });

  it('counts links per status', () => {
    expect(countByStatus(links, NOW)).toEqual({ all: 4, active: 2, paid: 1, expired: 1 });
    expect(countByStatus([], NOW)).toEqual({ all: 0, active: 0, paid: 0, expired: 0 });
  });
});
