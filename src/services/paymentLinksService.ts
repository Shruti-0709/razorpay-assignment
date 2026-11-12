/**
 * Payment links service — MOCK IMPLEMENTATION.
 *
 * Nothing is sent to a server. Data is kept in a Zustand store persisted to
 * this browser's localStorage (see paymentLinksStore.ts), so it survives page
 * reloads on this device only. The function signatures mirror what an HTTP
 * client would expose, so a real implementation can replace this module
 * without UI changes.
 */
import { applyPayment, canRecordPayment, getPaymentAmountError } from '../lib/payments';
import type { CreatePaymentLinkInput, PaymentLink } from '../types/paymentLink';
import { paymentLinksDb } from './paymentLinksStore';

const MOCK_LATENCY_MS = import.meta.env.MODE === 'test' ? 0 : 350;

function delay(ms = MOCK_LATENCY_MS): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 14)}`;
}

function byNewest(a: PaymentLink, b: PaymentLink): number {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

export async function getPaymentLinks(): Promise<PaymentLink[]> {
  await delay();
  return paymentLinksDb
    .getState()
    .links.map((link) => structuredClone(link))
    .sort(byNewest);
}

export async function createPaymentLink(
  input: CreatePaymentLinkInput,
): Promise<PaymentLink> {
  await delay();
  const link: PaymentLink = {
    id: generateId('plink'),
    amountPaise: input.amountPaise,
    description: input.description,
    customer: { ...input.customer },
    allowPartialPayments: input.allowPartialPayments,
    minFirstPaymentPaise: input.allowPartialPayments ? input.minFirstPaymentPaise : null,
    amountPaidPaise: 0,
    payments: [],
    createdAt: new Date().toISOString(),
    expiresAt: input.expiresAt,
    paidAt: null,
  };
  paymentLinksDb.setState((state) => ({ links: [link, ...state.links] }));
  return structuredClone(link);
}

/**
 * Records a payment against a link. Re-checks the business rules here (not only
 * in the form) so a stale UI, e.g. a link that expired while the dialog was
 * open, cannot record an invalid payment.
 */
export async function recordPayment(linkId: string, amountPaise: number): Promise<PaymentLink> {
  await delay();
  const now = new Date();
  const link = paymentLinksDb.getState().links.find((l) => l.id === linkId);
  if (!link) throw new Error('This payment link no longer exists.');
  if (!canRecordPayment(link, now)) {
    throw new Error('This payment link can no longer accept payments.');
  }
  const amountError = getPaymentAmountError(link, amountPaise);
  if (amountError) throw new Error(amountError);

  const updated = applyPayment(link, { id: generateId('pay'), amountPaise, recordedAt: now });
  paymentLinksDb.setState((state) => ({
    links: state.links.map((l) => (l.id === linkId ? updated : l)),
  }));
  return structuredClone(updated);
}

/** Test helper: replaces all stored links. */
export function resetPaymentLinksStore(links: PaymentLink[] = []): void {
  paymentLinksDb.setState({ links: links.map((link) => structuredClone(link)) });
}
