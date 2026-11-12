import * as yup from 'yup';
import {
  normalizeAmountInput,
  normalizePhoneInput,
  rupeesToPaise,
} from '../lib/format';
import type { CreatePaymentLinkInput } from '../types/paymentLink';

export const MAX_AMOUNT_PAISE = 5_00_000 * 100;
export const MAX_DESCRIPTION_LENGTH = 100;

/** Raw form values: everything is a string as typed by the user. */
export interface PaymentLinkFormValues {
  amount: string;
  description: string;
  customerEmail: string;
  customerPhone: string;
  /** datetime-local value ("YYYY-MM-DDTHH:mm", local time) or "". */
  expiresAt: string;
}

export const initialPaymentLinkFormValues: PaymentLinkFormValues = {
  amount: '',
  description: '',
  customerEmail: '',
  customerPhone: '',
  expiresAt: '',
};

export const MESSAGES = {
  amountRequired: 'Enter an amount',
  amountInvalid: 'Enter a valid amount, e.g. 1500 or 1500.50',
  amountDecimals: 'Amount can have at most 2 decimal places',
  amountPositive: 'Amount must be greater than ₹0',
  amountMax: 'Amount cannot exceed ₹5,00,000',
  descriptionRequired: 'Enter a description',
  descriptionMax: `Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer`,
  emailInvalid: 'Enter a valid email address, e.g. name@example.com',
  phoneInvalid: 'Enter a valid 10-digit Indian mobile number, e.g. 98765 43210',
  contactRequired: 'Enter a customer email or phone number',
  expiryInvalid: 'Enter a valid date and time',
  expiryPast: 'Expiry must be in the future',
} as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** 10-digit Indian mobile number starting 6–9, optional +91 / 91 / 0 prefix. */
const PHONE_PATTERN = /^(?:\+91|91|0)?[6-9]\d{9}$/;

/** Returns the first applicable amount error, in a fixed, predictable order. */
function getAmountError(raw: string | undefined): string | null {
  const value = normalizeAmountInput(raw ?? '');
  if (!value) return MESSAGES.amountRequired;
  if (!/^\d+(\.\d+)?$/.test(value)) return MESSAGES.amountInvalid;
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return MESSAGES.amountDecimals;
  const paise = rupeesToPaise(value);
  if (paise <= 0) return MESSAGES.amountPositive;
  if (paise > MAX_AMOUNT_PAISE) return MESSAGES.amountMax;
  return null;
}

function hasText(value: string | undefined): boolean {
  return Boolean(value?.trim());
}

export const paymentLinkSchema = yup
  .object({
    amount: yup
      .string()
      .default('')
      .test('amount', function (value) {
        const message = getAmountError(value);
        return message ? this.createError({ message }) : true;
      }),
    description: yup
      .string()
      .default('')
      .trim()
      .required(MESSAGES.descriptionRequired)
      .max(MAX_DESCRIPTION_LENGTH, MESSAGES.descriptionMax),
    customerEmail: yup
      .string()
      .default('')
      .trim()
      .test('email', MESSAGES.emailInvalid, (v) => !v || EMAIL_PATTERN.test(v)),
    customerPhone: yup
      .string()
      .default('')
      .test(
        'phone',
        MESSAGES.phoneInvalid,
        (v) => !hasText(v) || PHONE_PATTERN.test(normalizePhoneInput(v ?? '')),
      ),
    expiresAt: yup
      .string()
      .default('')
      .test('expiry', function (value) {
        if (!value) return true;
        const expiry = new Date(value);
        if (Number.isNaN(expiry.getTime())) {
          return this.createError({ message: MESSAGES.expiryInvalid });
        }
        const now: Date = this.options.context?.now ?? new Date();
        return expiry.getTime() > now.getTime()
          ? true
          : this.createError({ message: MESSAGES.expiryPast });
      }),
  })
  // Cross-field rule reported on a dedicated "customer" path for the fieldset.
  .test('contact', function (values) {
    if (hasText(values.customerEmail) || hasText(values.customerPhone)) return true;
    return this.createError({ path: 'customer', message: MESSAGES.contactRequired });
  });

/** Formik error shape, including the cross-field "customer" key. */
export type PaymentLinkFormErrors = Partial<
  Record<keyof PaymentLinkFormValues | 'customer', string>
>;

/** Maps validated form values to the service input. */
export function toCreatePaymentLinkInput(
  values: PaymentLinkFormValues,
): CreatePaymentLinkInput {
  const email = values.customerEmail.trim().toLowerCase();
  const phone = normalizePhoneInput(values.customerPhone);
  return {
    amountPaise: rupeesToPaise(values.amount),
    description: values.description.trim(),
    customer: {
      email: email || null,
      phone: phone ? `+91${phone.slice(-10)}` : null,
    },
    expiresAt: values.expiresAt ? new Date(values.expiresAt).toISOString() : null,
  };
}
