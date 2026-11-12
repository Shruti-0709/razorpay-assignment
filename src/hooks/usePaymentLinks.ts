import { useCallback, useEffect, useState } from 'react';
import {
  createPaymentLink,
  getPaymentLinks,
} from '../services/paymentLinksService';
import type { CreatePaymentLinkInput, PaymentLink } from '../types/paymentLink';

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success' };

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function usePaymentLinks() {
  const [links, setLinks] = useState<PaymentLink[]>([]);
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getPaymentLinks()
      .then((data) => {
        if (cancelled) return;
        setLinks(data);
        setLoadState({ status: 'success' });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setLoadState({
          status: 'error',
          message: errorMessage(error, 'Could not load payment links.'),
        });
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const reload = useCallback(() => {
    setLoadState({ status: 'loading' });
    setReloadKey((key) => key + 1);
  }, []);

  /** Creates a link and prepends it. Rejects so the form can show the error. */
  const create = useCallback(async (input: CreatePaymentLinkInput) => {
    const link = await createPaymentLink(input);
    setLinks((current) => [link, ...current]);
    return link;
  }, []);

  return { links, loadState, reload, create };
}
