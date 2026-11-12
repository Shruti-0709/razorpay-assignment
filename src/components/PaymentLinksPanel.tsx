import { CheckCircle2, CircleAlert, Link2, Loader2, RotateCw } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useNow } from '../hooks/useNow';
import { formatINR } from '../lib/format';
import { countByStatus, filterPaymentLinks, STATUS_FILTERS } from '../lib/status';
import type { PaymentLink, StatusFilterValue } from '../types/paymentLink';
import type { usePaymentLinks } from '../hooks/usePaymentLinks';
import { PaymentLinksTable } from './PaymentLinksTable';
import { RecordPaymentDialog } from './RecordPaymentDialog';
import { StatusFilter } from './StatusFilter';

interface PaymentLinksPanelProps {
  links: PaymentLink[];
  loadState: ReturnType<typeof usePaymentLinks>['loadState'];
  onRetry: () => void;
  onRecordPayment: (linkId: string, amountPaise: number) => Promise<PaymentLink>;
}

function EmptyState({ icon, title, children }: { icon: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-3 text-slate-400">{icon}</div>
      <p className="text-sm font-medium text-slate-900">{title}</p>
      {children && <div className="mt-1 text-sm text-slate-500">{children}</div>}
    </div>
  );
}

export function PaymentLinksPanel({ links, loadState, onRetry, onRecordPayment }: PaymentLinksPanelProps) {
  const [filter, setFilter] = useState<StatusFilterValue>('all');
  const [payingLink, setPayingLink] = useState<PaymentLink | null>(null);
  const [recordedMessage, setRecordedMessage] = useState<string | null>(null);
  const now = useNow();
  const counts = countByStatus(links, now);
  const visibleLinks = filterPaymentLinks(links, filter, now);
  const filterLabel = STATUS_FILTERS.find((option) => option.value === filter)?.label ?? '';

  let content: ReactNode;
  if (loadState.status === 'loading') {
    content = (
      <div role="status" className="flex items-center justify-center gap-2 py-14 text-sm text-slate-500">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Loading payment links…
      </div>
    );
  } else if (loadState.status === 'error') {
    content = (
      <div role="alert">
        <EmptyState icon={<CircleAlert className="size-6 text-red-500" />} title="Couldn't load payment links">
          <p>{loadState.message}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <RotateCw className="size-4" aria-hidden="true" />
            Try again
          </button>
        </EmptyState>
      </div>
    );
  } else if (links.length === 0) {
    content = (
      <EmptyState icon={<Link2 className="size-6" />} title="No payment links yet">
        Create your first link using the form.
      </EmptyState>
    );
  } else if (visibleLinks.length === 0) {
    content = (
      <EmptyState icon={<Link2 className="size-6" />} title={`No ${filterLabel.toLowerCase()} links`}>
        <button
          type="button"
          onClick={() => setFilter('all')}
          className="font-medium text-blue-600 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-blue-600"
        >
          Show all links
        </button>
      </EmptyState>
    );
  } else {
    content = (
      <PaymentLinksTable
        links={visibleLinks}
        now={now}
        onRecordPayment={(link) => {
          setRecordedMessage(null);
          setPayingLink(link);
        }}
      />
    );
  }

  return (
    <section aria-labelledby="links-heading" className="rounded-lg border border-slate-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 id="links-heading" className="text-base font-semibold text-slate-900">
          Payment links
        </h2>
        <StatusFilter value={filter} counts={counts} onChange={setFilter} />
      </div>
      <div aria-live="polite">
        {recordedMessage && (
          <p role="status" className="flex items-center gap-2 border-b border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
            <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
            {recordedMessage}
          </p>
        )}
      </div>
      {content}
      {payingLink && (
        <RecordPaymentDialog
          link={payingLink}
          onRecord={onRecordPayment}
          onRecorded={(updated, amountPaise) => {
            setPayingLink(null);
            setRecordedMessage(
              `Payment of ${formatINR(amountPaise)} recorded for “${updated.description}”.`,
            );
          }}
          onClose={() => setPayingLink(null)}
        />
      )}
    </section>
  );
}
