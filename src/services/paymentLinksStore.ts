/**
 * Persistence for the MOCK payment links service.
 *
 * A Zustand store with the `persist` middleware stands in for a backend
 * database: links are saved to this browser's localStorage, so they survive a
 * page reload, but they are never sent to a server. Only the service module
 * should read or write this store.
 */
import { createJSONStorage, persist } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';
import type { PaymentLink } from '../types/paymentLink';

export const PAYMENT_LINKS_STORAGE_KEY = 'payment-links-manager:links';

interface PaymentLinksDbState {
  links: PaymentLink[];
}

export const paymentLinksDb = createStore<PaymentLinksDbState>()(
  persist((): PaymentLinksDbState => ({ links: [] }), {
    name: PAYMENT_LINKS_STORAGE_KEY,
    version: 1,
    storage: createJSONStorage(() => localStorage),
    onRehydrateStorage: () => (_state, error) => {
      if (error) {
        console.warn('Saved payment links could not be read; starting with an empty list.', error);
      }
    },
  }),
);
