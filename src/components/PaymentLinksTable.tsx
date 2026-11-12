import { formatDateTime, formatINR } from '../lib/format';
import { getPaymentLinkStatus } from '../lib/status';
import type { PaymentLink } from '../types/paymentLink';
import { StatusBadge } from './StatusBadge';

interface PaymentLinksTableProps {
  links: PaymentLink[];
  now: Date;
}

const th = 'px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-slate-500';
// Below md, rows become stacked cards; each cell shows its own label.
const td = 'px-4 py-1 md:py-3 align-top max-md:flex max-md:justify-between max-md:gap-4';
const cellLabel = 'text-xs font-medium text-slate-500 md:hidden';

function expiryNote(link: PaymentLink, now: Date): string | null {
  if (!link.expiresAt || link.paidAt) return null;
  const verb = new Date(link.expiresAt) <= now ? 'Expired' : 'Expires';
  return `${verb} ${formatDateTime(link.expiresAt)}`;
}

export function PaymentLinksTable({ links, now }: PaymentLinksTableProps) {
  return (
    <table className="w-full text-sm">
      <thead className="border-b border-slate-200 bg-slate-50 max-md:hidden">
        <tr>
          <th scope="col" className={`${th} text-right`}>Amount</th>
          <th scope="col" className={th}>Description</th>
          <th scope="col" className={th}>Customer</th>
          <th scope="col" className={th}>Status</th>
          <th scope="col" className={th}>Created</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-200">
        {links.map((link) => {
          const status = getPaymentLinkStatus(link, now);
          const note = expiryNote(link, now);
          return (
            <tr key={link.id} data-testid="payment-link-row" className="max-md:block max-md:py-2 hover:bg-slate-50/60">
              <td className={`${td} font-medium tabular-nums text-slate-900 md:text-right md:whitespace-nowrap`}>
                <span className={cellLabel}>Amount</span>
                {formatINR(link.amountPaise)}
              </td>
              <td className={`${td} text-slate-700`}>
                <span className={cellLabel}>Description</span>
                <span className="break-words max-md:text-right md:max-w-xs">{link.description}</span>
              </td>
              <td className={`${td} text-slate-700`}>
                <span className={cellLabel}>Customer</span>
                <span className="flex min-w-0 flex-col max-md:items-end">
                  {link.customer.email && (
                    <span className="max-w-56 truncate" title={link.customer.email}>
                      {link.customer.email}
                    </span>
                  )}
                  {link.customer.phone && (
                    <span className="tabular-nums text-slate-500">{link.customer.phone}</span>
                  )}
                </span>
              </td>
              <td className={td}>
                <span className={cellLabel}>Status</span>
                <span className="flex flex-col items-start gap-1 max-md:items-end">
                  <StatusBadge status={status} />
                  {note && <span className="text-xs text-slate-500">{note}</span>}
                </span>
              </td>
              <td className={`${td} text-slate-500 md:whitespace-nowrap`}>
                <span className={cellLabel}>Created</span>
                <time dateTime={link.createdAt}>{formatDateTime(link.createdAt)}</time>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
