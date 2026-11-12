const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateTimeFormatter = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

export function formatINR(amountPaise: number): string {
  return inrFormatter.format(amountPaise / 100);
}

export function formatDateTime(iso: string): string {
  return dateTimeFormatter.format(new Date(iso));
}

/** Removes grouping commas and surrounding whitespace, e.g. " 5,00,000 " -> "500000". */
export function normalizeAmountInput(value: string): string {
  return value.replace(/,/g, '').trim();
}

/**
 * Converts a validated rupee string ("1500", "1500.5", "1500.50") to integer
 * paise using string arithmetic, avoiding float errors like 0.1 + 0.2.
 */
export function rupeesToPaise(value: string): number {
  const [rupees, fraction = ''] = normalizeAmountInput(value).split('.');
  return Number(rupees) * 100 + Number(fraction.padEnd(2, '0').slice(0, 2));
}

/** Strips spaces, dashes and brackets so "+91 98765-43210" -> "+919876543210". */
export function normalizePhoneInput(value: string): string {
  return value.replace(/[\s\-()]/g, '');
}

/** Formats a Date as the local "YYYY-MM-DDTHH:mm" value used by datetime-local inputs. */
export function toDateTimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}
