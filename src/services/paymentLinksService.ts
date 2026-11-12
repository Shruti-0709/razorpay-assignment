/**
 * Payment links service — MOCK IMPLEMENTATION.
 *
 * Data lives in memory only (it resets on page reload) and nothing is sent to
 * a server. The function signatures mirror what an HTTP client would expose,
 * so a real implementation can replace this module without UI changes.
 */
import { createSeedPaymentLinks } from '../mocks/paymentLinks';
import type { CreatePaymentLinkInput, PaymentLink } from '../types/paymentLink';

const MOCK_LATENCY_MS = import.meta.env.MODE === 'test' ? 0 : 350;

let store: PaymentLink[] = createSeedPaymentLinks(new Date());

function delay(ms = MOCK_LATENCY_MS): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateId(): string {
  return `plink_${crypto.randomUUID().replace(/-/g, '').slice(0, 14)}`;
}

function byNewest(a: PaymentLink, b: PaymentLink): number {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

export async function getPaymentLinks(): Promise<PaymentLink[]> {
  await delay();
  return store.map((link) => structuredClone(link)).sort(byNewest);
}

export async function createPaymentLink(
  input: CreatePaymentLinkInput,
): Promise<PaymentLink> {
  await delay();
  const link: PaymentLink = {
    id: generateId(),
    amountPaise: input.amountPaise,
    description: input.description,
    customer: { ...input.customer },
    createdAt: new Date().toISOString(),
    expiresAt: input.expiresAt,
    paidAt: null,
  };
  store = [link, ...store];
  return structuredClone(link);
}

/** Test helper: replaces the in-memory store. */
export function resetPaymentLinksStore(links: PaymentLink[] = []): void {
  store = links.map((link) => structuredClone(link));
}
