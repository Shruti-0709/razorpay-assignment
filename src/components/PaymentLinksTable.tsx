import { formatDateTime, formatINR } from '../lib/format';
import { canRecordPayment, getAmountDuePaise } from '../lib/payments';
import { getPaymentLinkStatus } from '../lib/status';
import type { PaymentLink } from '../types/paymentLink';
import { StatusBadge } from './StatusBadge';

interface PaymentLinksTableProps {
  links: PaymentLink[];
  now: Date;
  onRecordPayment: (link: PaymentLink) => void;
}

const th = 'px-4 xl:px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-slate-500';
// Below md, rows become stacked cards; each cell shows its own label.
const td = 'px-4 xl:px-3 py-1 xl:py-3 align-top max-xl:flex max-xl:justify-between max-xl:gap-4';
const cellLabel = 'text-xs font-medium text-slate-500 xl:hidden';

function expiryNote(link: PaymentLink, now: Date): string | null {
  if (!link.expiresAt || link.paidAt) return null;
  const verb = new Date(link.expiresAt) <= now ? 'Expired' : 'Expires';
  return `${verb} ${formatDateTime(link.expiresAt)}`;
}

export function PaymentLinksTable({ links, now, onRecordPayment }: PaymentLinksTableProps) {
  return (
    // At md+ the table scrolls inside its card if the viewport is too narrow, never the page.
    <div className="relative xl:overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 max-xl:hidden">
          <tr>
            <th scope="col" className={`${th} text-right`}>Amount</th>
            <th scope="col" className={th}>Description</th>
            <th scope="col" className={th}>Customer</th>
            <th scope="col" className={`${th} text-right`}>Paid / Due</th>
            <th scope="col" className={th}>Status</th>
            <th scope="col" className={th}>Created</th>
            <th scope="col" className={th}>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {links.map((link) => {
            const status = getPaymentLinkStatus(link, now);
            const note = expiryNote(link, now);
            const duePaise = getAmountDuePaise(link);
            return (
              <tr key={link.id} data-testid="payment-link-row" className="max-xl:block max-xl:py-2 hover:bg-slate-50/60">
                <td className={`${td} font-medium tabular-nums text-slate-900 xl:text-right xl:whitespace-nowrap`}>
                  <span className={cellLabel}>Amount</span>
                  {formatINR(link.amountPaise)}
                </td>
                <td className={`${td} text-slate-700`}>
                  <span className={cellLabel}>Description</span>
                  <span className="break-words max-xl:text-right xl:max-w-xs">{link.description}</span>
                </td>
                <td className={`${td} text-slate-700`}>
                  <span className={cellLabel}>Customer</span>
                  <span className="flex min-w-0 flex-col max-xl:items-end">
                    {link.customer.email && (
                      <span className="max-w-40 truncate" title={link.customer.email}>
                        {link.customer.email}
                      </span>
                    )}
                    {link.customer.phone && (
                      <span className="tabular-nums text-slate-500">{link.customer.phone}</span>
                    )}
                  </span>
                </td>
                <td className={`${td} tabular-nums xl:text-right xl:whitespace-nowrap`} data-testid="paid-due">
                  <span className={cellLabel}>Paid / Due</span>
                  <span className="flex flex-col max-xl:items-end">
                    <span className="text-slate-900">{formatINR(link.amountPaidPaise)} paid</span>
                    <span className="text-xs text-slate-500">{formatINR(duePaise)} due</span>
                  </span>
                </td>
                <td className={td}>
                  <span className={cellLabel}>Status</span>
                  <span className="flex flex-col items-start gap-1 max-xl:items-end">
                    <StatusBadge status={status} />
                    {note && <span className="text-xs text-slate-500">{note}</span>}
                  </span>
                </td>
                <td className={`${td} text-slate-500 xl:min-w-28`}>
                  <span className={cellLabel}>Created</span>
                  <time dateTime={link.createdAt}>{formatDateTime(link.createdAt)}</time>
                </td>
                <td className={`${td} xl:text-right xl:whitespace-nowrap`}>
                  {canRecordPayment(link, now) && (
                    <button
                      type="button"
                      onClick={() => onRecordPayment(link)}
                      aria-label={`Record payment for ${link.description}`}
                      className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 max-xl:mt-1 max-xl:w-full max-xl:py-1.5"
                    >
                      Record
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
