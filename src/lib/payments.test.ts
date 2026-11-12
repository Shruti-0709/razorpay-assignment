import { describe, expect, it } from 'vitest';
import type { PaymentLink } from '../types/paymentLink';
import { applyPayment, canRecordPayment, getAmountDuePaise, getPaymentAmountError } from './payments';

const NOW = new Date('2026-11-12T10:00:00Z');

function makeLink(overrides: Partial<PaymentLink> = {}): PaymentLink {
  return {
    id: 'plink_1',
    amountPaise: 100_000, // ₹1,000
    description: 'Invoice',
    customer: { email: 'a@example.com', phone: null },
    allowPartialPayments: true,
    minFirstPaymentPaise: 25_000, // ₹250
    amountPaidPaise: 0,
    payments: [],
    createdAt: '2026-11-12T09:00:00Z',
    expiresAt: null,
    paidAt: null,
    ...overrides,
  };
}

describe('getPaymentAmountError', () => {
  it('rejects zero, negative and non-integer paise', () => {
    expect(getPaymentAmountError(makeLink(), 0)).toMatch(/greater than ₹0/);
    expect(getPaymentAmountError(makeLink(), -100)).toMatch(/greater than ₹0/);
    expect(getPaymentAmountError(makeLink(), 10.5)).toMatch(/greater than ₹0/);
  });

  it('rejects more than the amount due, accepts exactly the amount due', () => {
    const link = makeLink({ amountPaidPaise: 40_000 });
    expect(getPaymentAmountError(link, 60_001)).toMatch(/cannot exceed the amount due \(₹600\.00\)/);
    expect(getPaymentAmountError(link, 60_000)).toBeNull();
  });

  it('enforces the minimum on the first payment only', () => {
    expect(getPaymentAmountError(makeLink(), 24_999)).toMatch(/at least ₹250\.00/);
    expect(getPaymentAmountError(makeLink(), 25_000)).toBeNull();
    // Later payments can be any amount up to the amount due.
    expect(getPaymentAmountError(makeLink({ amountPaidPaise: 30_000 }), 100)).toBeNull();
  });

  it('requires the full amount due when partial payments are not allowed', () => {
    const link = makeLink({ allowPartialPayments: false, minFirstPaymentPaise: null });
    expect(getPaymentAmountError(link, 50_000)).toMatch(/doesn't allow partial payments/);
    expect(getPaymentAmountError(link, 100_000)).toBeNull();
  });
});

describe('canRecordPayment', () => {
  it('allows Active and Partially paid links only', () => {
    expect(canRecordPayment(makeLink(), NOW)).toBe(true);
    expect(canRecordPayment(makeLink({ amountPaidPaise: 30_000 }), NOW)).toBe(true);
    expect(canRecordPayment(makeLink({ amountPaidPaise: 100_000 }), NOW)).toBe(false);
    expect(canRecordPayment(makeLink({ expiresAt: '2026-11-12T09:59:00Z' }), NOW)).toBe(false);
  });
});

describe('applyPayment', () => {
  it('accumulates payments and marks the link paid when fully settled', () => {
    const first = applyPayment(makeLink(), { id: 'pay_1', amountPaise: 40_000, recordedAt: NOW });
    expect(first.amountPaidPaise).toBe(40_000);
    expect(getAmountDuePaise(first)).toBe(60_000);
    expect(first.paidAt).toBeNull();

    const second = applyPayment(first, { id: 'pay_2', amountPaise: 60_000, recordedAt: NOW });
    expect(second.amountPaidPaise).toBe(100_000);
    expect(getAmountDuePaise(second)).toBe(0);
    expect(second.paidAt).toBe(NOW.toISOString());
    expect(second.payments.map((p) => p.id)).toEqual(['pay_1', 'pay_2']);
  });
});
