import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CreatePaymentLinkInput } from '../types/paymentLink';
import { PAYMENT_LINKS_STORAGE_KEY } from './paymentLinksStore';

const input: CreatePaymentLinkInput = {
  amountPaise: 100_000,
  description: 'Persisted invoice',
  customer: { email: 'a@example.com', phone: null },
  expiresAt: null,
  allowPartialPayments: true,
  minFirstPaymentPaise: 25_000,
};

/** Fresh module instances = what a page reload does to in-memory state. */
async function loadService() {
  vi.resetModules();
  return import('./paymentLinksService');
}

describe('paymentLinksService persistence', () => {
  beforeEach(() => localStorage.clear());

  it('starts empty when nothing is stored', async () => {
    const service = await loadService();
    expect(await service.getPaymentLinks()).toEqual([]);
  });

  it('keeps created links and recorded payments across a reload', async () => {
    const before = await loadService();
    const created = await before.createPaymentLink(input);
    await before.recordPayment(created.id, 30_000);
    expect(localStorage.getItem(PAYMENT_LINKS_STORAGE_KEY)).toContain('Persisted invoice');

    const after = await loadService();
    const [link] = await after.getPaymentLinks();
    expect(link.id).toBe(created.id);
    expect(link.amountPaidPaise).toBe(30_000);
    expect(link.payments).toHaveLength(1);
  });

  it('starts empty instead of crashing when stored data is corrupt', async () => {
    localStorage.setItem(PAYMENT_LINKS_STORAGE_KEY, '{not json');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const service = await loadService();
    expect(await service.getPaymentLinks()).toEqual([]);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe('recordPayment', () => {
  beforeEach(() => localStorage.clear());

  it('rejects payments that break the rules and leaves the link unchanged', async () => {
    const service = await loadService();
    const link = await service.createPaymentLink(input);

    await expect(service.recordPayment(link.id, 10_000)).rejects.toThrow(/at least ₹250\.00/);
    await expect(service.recordPayment(link.id, 100_001)).rejects.toThrow(/cannot exceed/);
    await expect(service.recordPayment('missing', 100)).rejects.toThrow(/no longer exists/);
    expect((await service.getPaymentLinks())[0].amountPaidPaise).toBe(0);
  });

  it('rejects payments on expired and fully paid links', async () => {
    const service = await loadService();
    const expired = await service.createPaymentLink({
      ...input,
      expiresAt: new Date(Date.now() - 60_000).toISOString(),
    });
    await expect(service.recordPayment(expired.id, 30_000)).rejects.toThrow(/can no longer accept payments/);

    const link = await service.createPaymentLink(input);
    const paid = await service.recordPayment(link.id, 100_000);
    expect(paid.paidAt).not.toBeNull();
    await expect(service.recordPayment(link.id, 1)).rejects.toThrow(/can no longer accept payments/);
  });
});
