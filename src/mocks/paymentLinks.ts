import type { PaymentLink } from '../types/paymentLink';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/**
 * SIMULATED DATA — seed links for the in-memory mock service. Timestamps are
 * relative to `now` so the sample always contains Active, Paid and Expired links.
 */
export function createSeedPaymentLinks(now: Date): PaymentLink[] {
  const at = (offsetMs: number) => new Date(now.getTime() + offsetMs).toISOString();
  return [
    {
      id: 'plink_seed_0004',
      amountPaise: 249_900,
      description: 'Annual plan renewal – Pro tier',
      customer: { email: 'accounts@northwind.in', phone: null },
      createdAt: at(-2 * HOUR),
      expiresAt: at(5 * DAY),
      paidAt: null,
    },
    {
      id: 'plink_seed_0003',
      amountPaise: 1_850_000,
      description: 'Website redesign – milestone 2',
      customer: { email: 'priya@lotusdesigns.co', phone: '+919812345678' },
      createdAt: at(-1 * DAY),
      expiresAt: null,
      paidAt: at(-20 * HOUR),
    },
    {
      id: 'plink_seed_0002',
      amountPaise: 75_050,
      description: 'Catering advance for team offsite',
      customer: { email: null, phone: '+919876543210' },
      createdAt: at(-4 * DAY),
      expiresAt: at(-1 * DAY),
      paidAt: null,
    },
    {
      id: 'plink_seed_0001',
      amountPaise: 12_00_000,
      description: 'Consulting retainer – October',
      customer: { email: 'finance@acmecorp.in', phone: null },
      createdAt: at(-9 * DAY),
      expiresAt: null,
      paidAt: null,
    },
  ];
}
