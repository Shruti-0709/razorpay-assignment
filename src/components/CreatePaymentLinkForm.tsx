import { useFormik } from 'formik';
import { CheckCircle2, CircleAlert, Loader2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useNow } from '../hooks/useNow';
import { formatINR, toDateTimeLocalValue } from '../lib/format';
import type { CreatePaymentLinkInput, PaymentLink } from '../types/paymentLink';
import {
  MAX_DESCRIPTION_LENGTH,
  initialPaymentLinkFormValues,
  paymentLinkSchema,
  toCreatePaymentLinkInput,
  type PaymentLinkFormErrors,
  type PaymentLinkFormValues,
} from '../validation/paymentLinkSchema';
import { FormField, inputClassName } from './FormField';

interface CreatePaymentLinkFormProps {
  onCreate: (input: CreatePaymentLinkInput) => Promise<PaymentLink>;
}

type SubmitResult =
  | { type: 'success'; link: PaymentLink }
  | { type: 'error'; message: string }
  | null;

/** Field ids in visual order, used to focus the first invalid field on submit. */
const FIELD_ORDER: [keyof PaymentLinkFormErrors, string][] = [
  ['amount', 'amount'],
  ['description', 'description'],
  ['customer', 'customerEmail'],
  ['customerEmail', 'customerEmail'],
  ['customerPhone', 'customerPhone'],
  ['expiresAt', 'expiresAt'],
];

export function CreatePaymentLinkForm({ onCreate }: CreatePaymentLinkFormProps) {
  const [result, setResult] = useState<SubmitResult>(null);
  const now = useNow(60_000);

  const formik = useFormik<PaymentLinkFormValues>({
    initialValues: initialPaymentLinkFormValues,
    validationSchema: paymentLinkSchema,
    onSubmit: async (values, helpers) => {
      setResult(null);
      try {
        const link = await onCreate(toCreatePaymentLinkInput(values));
        helpers.resetForm();
        setResult({ type: 'success', link });
      } catch (error) {
        setResult({
          type: 'error',
          message:
            error instanceof Error && error.message
              ? error.message
              : 'Could not create the payment link. Please try again.',
        });
      }
    },
  });

  const { values, touched, isSubmitting } = formik;
  const errors = formik.errors as PaymentLinkFormErrors;
  const fieldError = (name: keyof PaymentLinkFormValues) =>
    touched[name] ? errors[name] : undefined;
  // The "at least one contact" error waits until both contact fields were visited (or submit).
  const customerError =
    touched.customerEmail && touched.customerPhone ? errors.customer : undefined;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    const validationErrors = (await formik.validateForm()) as PaymentLinkFormErrors;
    await formik.submitForm(); // marks all fields touched; only submits when valid
    const firstInvalid = FIELD_ORDER.find(([key]) => validationErrors[key]);
    if (firstInvalid) document.getElementById(firstInvalid[1])?.focus();
  }

  return (
    <form noValidate onSubmit={handleSubmit} aria-labelledby="create-link-heading" className="space-y-5">
      <FormField id="amount" label="Amount" error={fieldError('amount')} helpText="Up to ₹5,00,000">
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
              placeholder="0.00"
              disabled={isSubmitting}
              className={`${inputClassName} pl-7 tabular-nums`}
            />
          </div>
        )}
      </FormField>

      <FormField
        id="description"
        label="Description"
        error={fieldError('description')}
        helpText={`${values.description.length}/${MAX_DESCRIPTION_LENGTH} characters`}
      >
        {(aria) => (
          <input
            {...aria}
            {...formik.getFieldProps('description')}
            type="text"
            placeholder="e.g. Invoice #1042 – design services"
            disabled={isSubmitting}
            className={inputClassName}
          />
        )}
      </FormField>

      <fieldset
        aria-describedby={customerError ? 'customer-error' : 'customer-help'}
        className="space-y-4"
      >
        <legend className="text-sm font-medium text-slate-700">Customer</legend>
        <p
          id={customerError ? 'customer-error' : 'customer-help'}
          className={`-mt-2 text-xs ${customerError ? 'text-red-600' : 'text-slate-500'}`}
        >
          {customerError ?? 'Provide an email, a phone number, or both.'}
        </p>
        <FormField id="customerEmail" label="Email" error={fieldError('customerEmail')}>
          {(aria) => (
            <input
              {...aria}
              {...formik.getFieldProps('customerEmail')}
              aria-invalid={aria['aria-invalid'] || Boolean(customerError)}
              type="email"
              autoComplete="email"
              placeholder="customer@example.com"
              disabled={isSubmitting}
              className={inputClassName}
            />
          )}
        </FormField>
        <FormField id="customerPhone" label="Phone" error={fieldError('customerPhone')}>
          {(aria) => (
            <input
              {...aria}
              {...formik.getFieldProps('customerPhone')}
              aria-invalid={aria['aria-invalid'] || Boolean(customerError)}
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              placeholder="98765 43210"
              disabled={isSubmitting}
              className={inputClassName}
            />
          )}
        </FormField>
      </fieldset>

      <FormField
        id="expiresAt"
        label="Expiry"
        labelHint="Optional"
        error={fieldError('expiresAt')}
        helpText="Leave blank for a link that never expires."
      >
        {(aria) => (
          <input
            {...aria}
            {...formik.getFieldProps('expiresAt')}
            type="datetime-local"
            min={toDateTimeLocalValue(now)}
            disabled={isSubmitting}
            className={inputClassName}
          />
        )}
      </FormField>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        {isSubmitting ? 'Creating link…' : 'Create payment link'}
      </button>

      <div aria-live="polite">
        {result?.type === 'success' && (
          <p role="status" className="flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            Payment link for {formatINR(result.link.amountPaise)} created.
          </p>
        )}
        {result?.type === 'error' && (
          <p role="alert" className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {result.message}
          </p>
        )}
      </div>
    </form>
  );
}
