import { STATUS_LABELS } from '../lib/status';
import type { PaymentLinkStatus } from '../types/paymentLink';

const STYLES: Record<PaymentLinkStatus, string> = {
  active: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  partially_paid: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  paid: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  expired: 'bg-slate-100 text-slate-600 ring-slate-500/20',
};

export function StatusBadge({ status }: { status: PaymentLinkStatus }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
