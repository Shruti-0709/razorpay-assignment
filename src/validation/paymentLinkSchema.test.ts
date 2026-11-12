import { describe, expect, it } from 'vitest';
import { ValidationError } from 'yup';
import { rupeesToPaise } from '../lib/format';
import type { PaymentLink } from '../types/paymentLink';
import {
  MESSAGES,
  createRecordPaymentSchema,
  initialPaymentLinkFormValues,
  paymentLinkSchema,
  toCreatePaymentLinkInput,
  type PaymentLinkFormErrors,
  type PaymentLinkFormValues,
} from './paymentLinkSchema';

const NOW = new Date('2026-11-12T10:00:00');

const valid: PaymentLinkFormValues = {
  amount: '1500.50',
  description: 'Invoice #1042',
  customerEmail: 'customer@example.com',
  customerPhone: '',
  expiresAt: '',
  allowPartialPayments: false,
  minFirstPayment: '',
};

/** Validates like Formik does (all errors) and returns the first error per field. */
async function validate(overrides: Partial<PaymentLinkFormValues>): Promise<PaymentLinkFormErrors> {
  try {
    await paymentLinkSchema.validate({ ...valid, ...overrides }, { abortEarly: false, context: { now: NOW } });
    return {};
  } catch (error) {
    if (!(error instanceof ValidationError)) throw error;
    const errors: PaymentLinkFormErrors = {};
    for (const inner of error.inner) {
      const path = inner.path as keyof PaymentLinkFormErrors;
      errors[path] ??= inner.message;
    }
    return errors;
  }
}

describe('paymentLinkSchema', () => {
  it('accepts a valid payment link', async () => {
    expect(await validate({})).toEqual({});
  });

  it('reports every required-field error on an empty form', async () => {
    expect(await validate(initialPaymentLinkFormValues)).toEqual({
      amount: MESSAGES.amountRequired,
      description: MESSAGES.descriptionRequired,
      customer: MESSAGES.contactRequired,
    });
  });

  describe('amount', () => {
    it.each([
      ['0', MESSAGES.amountPositive],
      ['0.00', MESSAGES.amountPositive],
      ['-5', MESSAGES.amountInvalid],
      ['abc', MESSAGES.amountInvalid],
      ['1e3', MESSAGES.amountInvalid],
      ['10.999', MESSAGES.amountDecimals],
      ['500000.01', MESSAGES.amountMax],
      ['600000', MESSAGES.amountMax],
      ['   ', MESSAGES.amountRequired],
    ])('rejects %j', async (amount, message) => {
      expect((await validate({ amount })).amount).toBe(message);
    });

    it.each(['0.01', '1', '99.9', '500000', '500000.00', '5,00,000'])(
      'accepts boundary/formatted value %j',
      async (amount) => {
        expect((await validate({ amount })).amount).toBeUndefined();
      },
    );

    it('converts rupees to integer paise without float error', () => {
      expect(rupeesToPaise('0.1')).toBe(10);
      expect(rupeesToPaise('1500.05')).toBe(150005);
      expect(rupeesToPaise('5,00,000')).toBe(50_000_000);
    });
  });

  describe('description', () => {
    it('allows exactly 100 characters and rejects 101', async () => {
      expect((await validate({ description: 'a'.repeat(100) })).description).toBeUndefined();
      expect((await validate({ description: 'a'.repeat(101) })).description).toBe(MESSAGES.descriptionMax);
    });

    it('treats whitespace-only as empty', async () => {
      expect((await validate({ description: '   ' })).description).toBe(MESSAGES.descriptionRequired);
    });
  });

  describe('customer contact', () => {
    it('requires at least one of email or phone', async () => {
      const errors = await validate({ customerEmail: '', customerPhone: '' });
      expect(errors.customer).toBe(MESSAGES.contactRequired);
    });

    it('accepts phone only', async () => {
      expect(await validate({ customerEmail: '', customerPhone: '+91 98765 43210' })).toEqual({});
    });

    it.each(['not-an-email', 'a@b', 'a b@example.com'])('rejects email %j', async (customerEmail) => {
      expect((await validate({ customerEmail })).customerEmail).toBe(MESSAGES.emailInvalid);
    });

    it.each(['12345', '5876543210', '98765432101', '+1 9876543210'])('rejects phone %j', async (customerPhone) => {
      expect((await validate({ customerPhone })).customerPhone).toBe(MESSAGES.phoneInvalid);
    });

    it('validates the format of a filled field even when the other one is valid', async () => {
      const errors = await validate({ customerEmail: 'ok@example.com', customerPhone: '123' });
      expect(errors).toEqual({ customerPhone: MESSAGES.phoneInvalid });
    });
  });

  describe('expiry', () => {
    it('is optional', async () => {
      expect((await validate({ expiresAt: '' })).expiresAt).toBeUndefined();
    });

    it('rejects past and current times, accepts future times', async () => {
      expect((await validate({ expiresAt: '2026-11-12T09:59' })).expiresAt).toBe(MESSAGES.expiryPast);
      expect((await validate({ expiresAt: '2026-11-12T10:00' })).expiresAt).toBe(MESSAGES.expiryPast);
      expect((await validate({ expiresAt: '2026-11-12T10:01' })).expiresAt).toBeUndefined();
    });
  });
});

describe('partial payments', () => {
  it('ignores the minimum first payment when partial payments are off', async () => {
    expect(await validate({ allowPartialPayments: false, minFirstPayment: 'garbage' })).toEqual({});
  });

  it.each([
    ['', MESSAGES.minFirstRequired],
    ['abc', MESSAGES.minFirstInvalid],
    ['0', MESSAGES.minFirstPositive],
    ['10.555', MESSAGES.amountDecimals],
    ['1500.51', MESSAGES.minFirstAboveAmount],
  ])('rejects minimum first payment %j when partial payments are on', async (minFirstPayment, message) => {
    const errors = await validate({ allowPartialPayments: true, minFirstPayment });
    expect(errors.minFirstPayment).toBe(message);
  });

  it.each(['0.01', '500', '1500.50'])('accepts minimum first payment %j (≤ amount ₹1500.50)', async (minFirstPayment) => {
    expect(await validate({ allowPartialPayments: true, minFirstPayment })).toEqual({});
  });

  it('only compares against the amount once the amount is valid', async () => {
    const errors = await validate({ amount: '', allowPartialPayments: true, minFirstPayment: '100' });
    expect(errors.amount).toBe(MESSAGES.amountRequired);
    expect(errors.minFirstPayment).toBeUndefined();
  });
});

describe('createRecordPaymentSchema', () => {
  const link: PaymentLink = {
    id: 'plink_1',
    amountPaise: 100_000,
    description: 'Invoice',
    customer: { email: 'a@example.com', phone: null },
    allowPartialPayments: true,
    minFirstPaymentPaise: 25_000,
    amountPaidPaise: 0,
    payments: [],
    createdAt: '2026-11-12T09:00:00Z',
    expiresAt: null,
    paidAt: null,
  };

  async function paymentError(amount: string, target: PaymentLink = link) {
    try {
      await createRecordPaymentSchema(target).validate({ amount });
      return undefined;
    } catch (error) {
      return (error as ValidationError).message;
    }
  }

  it('applies format and business rules to the payment amount', async () => {
    expect(await paymentError('')).toBe(MESSAGES.paymentRequired);
    expect(await paymentError('1.234')).toBe(MESSAGES.amountDecimals);
    expect(await paymentError('249.99')).toMatch(/at least ₹250\.00/);
    expect(await paymentError('1000.01')).toMatch(/cannot exceed the amount due/);
    expect(await paymentError('250')).toBeUndefined();
    expect(await paymentError('1,000')).toBeUndefined();
  });
});

describe('toCreatePaymentLinkInput', () => {
  it('normalises form values into the service input', () => {
    expect(
      toCreatePaymentLinkInput({
        amount: '1,500.5',
        description: '  Invoice  ',
        customerEmail: ' Customer@Example.com ',
        customerPhone: '098765-43210',
        expiresAt: '',
        allowPartialPayments: false,
        minFirstPayment: '999',
      }),
    ).toEqual({
      amountPaise: 150050,
      description: 'Invoice',
      customer: { email: 'customer@example.com', phone: '+919876543210' },
      expiresAt: null,
      allowPartialPayments: false,
      minFirstPaymentPaise: null,
    });
  });

  it('includes the minimum first payment in paise when partial payments are on', () => {
    const input = toCreatePaymentLinkInput({ ...valid, allowPartialPayments: true, minFirstPayment: '250.5' });
    expect(input.allowPartialPayments).toBe(true);
    expect(input.minFirstPaymentPaise).toBe(25050);
  });
});
