import { useFormik } from 'formik';
import { CircleAlert, Loader2, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { formatINR, rupeesToPaise } from '../lib/format';
import { getAmountDuePaise, getMinimumNextPaymentPaise } from '../lib/payments';
import type { PaymentLink } from '../types/paymentLink';
import {
  createRecordPaymentSchema,
  type RecordPaymentFormValues,
} from '../validation/paymentLinkSchema';
import { FormField, inputClassName } from './FormField';

interface RecordPaymentDialogProps {
  link: PaymentLink;
  onRecord: (linkId: string, amountPaise: number) => Promise<PaymentLink>;
  onRecorded: (link: PaymentLink, amountPaise: number) => void;
  onClose: () => void;
}

/** Paise -> plain rupee string for the input, e.g. 150050 -> "1500.50". */
function paiseToInput(paise: number): string {
  return (paise / 100).toFixed(2);
}

export function RecordPaymentDialog({ link, onRecord, onRecorded, onClose }: RecordPaymentDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const duePaise = getAmountDuePaise(link);
  const minimumPaise = getMinimumNextPaymentPaise(link);
  const isFirstPayment = link.amountPaidPaise === 0;
  const schema = useMemo(() => createRecordPaymentSchema(link), [link]);

  // Native modal dialog: focus trapping, Esc to close and inert background come from the browser.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const formik = useFormik<RecordPaymentFormValues>({
    // Non-partial links can only be settled in full, so prefill (and lock) the amount due.
    initialValues: { amount: link.allowPartialPayments ? '' : paiseToInput(duePaise) },
    validationSchema: schema,
    onSubmit: async (values) => {
      setSubmitError(null);
      const amountPaise = rupeesToPaise(values.amount);
      let updated: PaymentLink;
      try {
        updated = await onRecord(link.id, amountPaise);
      } catch (error) {
        setSubmitError(
          error instanceof Error && error.message ? error.message : 'Could not record the payment. Please try again.',
        );
        return;
      }
      onRecorded(updated, amountPaise);
    },
  });

  const { isSubmitting } = formik;
  const amountError = formik.touched.amount ? formik.errors.amount : undefined;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    const errors = await formik.validateForm();
    await formik.submitForm();
    if (errors.amount) document.getElementById('paymentAmount')?.focus();
  }

  let helpText: string;
  if (!link.allowPartialPayments) helpText = 'Partial payments are off for this link, so the full amount due is required.';
  else if (isFirstPayment && link.minFirstPaymentPaise) helpText = `Between ${formatINR(minimumPaise)} and ${formatINR(duePaise)} (minimum first payment).`;
  else helpText = `Up to ${formatINR(duePaise)}.`;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="record-payment-heading"
      onClose={onClose}
      onCancel={(event) => {
        if (isSubmitting) event.preventDefault(); // don't close mid-request
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-lg border border-slate-200 bg-white p-0 text-slate-900 shadow-xl backdrop:bg-slate-900/40"
    >
      <form noValidate onSubmit={handleSubmit}>
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <h2 id="record-payment-heading" className="text-base font-semibold">
              Record payment
            </h2>
            <p className="mt-0.5 truncate text-sm text-slate-500" title={link.description}>
              {link.description}
            </p>
          </div>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            disabled={isSubmitting}
            aria-label="Close"
            className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <dl className="grid grid-cols-3 gap-3 rounded-md bg-slate-50 px-3 py-2.5 text-sm">
            <div>
              <dt className="text-xs text-slate-500">Total</dt>
              <dd className="font-medium tabular-nums">{formatINR(link.amountPaise)}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Paid</dt>
              <dd className="font-medium tabular-nums">{formatINR(link.amountPaidPaise)}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Due</dt>
              <dd className="font-medium tabular-nums">{formatINR(duePaise)}</dd>
            </div>
          </dl>

          <FormField id="paymentAmount" label="Payment amount" error={amountError} helpText={helpText}>
            {(aria) => (
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-slate-500">
                  ₹
                </span>
                <input
                  {...aria}
                  {...formik.getFieldProps('amount')}
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  autoFocus
                  placeholder="0.00"
                  readOnly={!link.allowPartialPayments}
                  disabled={isSubmitting}
                  className={`${inputClassName} pl-7 tabular-nums read-only:bg-slate-50`}
                />
              </div>
            )}
          </FormField>

          {submitError && (
            <p role="alert" className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {submitError}
            </p>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 px-5 py-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            disabled={isSubmitting}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {isSubmitting ? 'Recording…' : 'Record payment'}
          </button>
        </div>
      </form>
    </dialog>
  );
}
