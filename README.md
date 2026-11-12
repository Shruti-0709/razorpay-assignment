# Payment Links Manager

A Payment Links manager for a merchant dashboard. You can create payment links with validation, record full or partial payments, and list links with their status (Active, Partially paid, Paid or Expired), filtered by status.

**Stack:** Vite · React 19 · TypeScript · Tailwind CSS v4 · Formik + Yup · Zustand (persist) · lucide-react · Vitest + Testing Library · Playwright

> **Data is simulated.** There is no backend. A mock service (`src/services/paymentLinksService.ts`) keeps links in a Zustand store that is saved to this browser's `localStorage` (key `payment-links-manager:links`). Links survive a page reload but are never sent to a server. To start over, clear that key or the site data.

## Commands

Requires Node.js 20.19+ (tested on 22) and npm.

```bash
npm install                          # install dependencies
npx playwright install chromium      # one-time: browser for E2E tests

npm run dev                          # start the app at http://localhost:5173
npm test                             # unit + component tests (Vitest)
npm run test:e2e                     # Playwright E2E (starts the dev server on :4173)

npm run lint                         # oxlint
npm run typecheck                    # tsc
npm run build                        # type-check + production build
```

## Features

- **Create form**:
  - **Amount** (₹): required, > 0, max 2 decimals, max ₹5,00,000. Commas such as `5,00,000` are accepted.
  - **Description**: required, max 100 characters, with a live counter.
  - **Customer**: an email **or** a phone number (at least one), and each filled field is format-checked.
  - **Expiry**: optional, and must be in the future.
  - **Allow partial payments**: optional. When ticked, a **minimum first payment** is required: > 0, max 2 decimals, and no more than the amount.
- **Record payment**: available on Active and Partially paid links, in a modal dialog that shows the total, the amount paid and the amount due.
  - A payment must be > 0 and no more than the amount due. The first payment must also meet the minimum first payment.
  - Links without partial payments can only be settled in full: the amount is prefilled and read-only.
- **List**: amount, description, customer, paid / due, status and created time, newest first. It is a table on wide screens (≥1280px) and stacked cards on narrower ones.
- **Status filter**: All / Active / Partially paid / Paid / Expired, with a count for each.
- **States**: loading, load error with retry, no links yet, no links for the selected filter, create and record-payment success or failure, and inline field validation.
- **Accessibility**: every control has a label, errors are linked to their fields with `aria-describedby` and `aria-invalid`, focus moves to the first invalid field on submit, the filter buttons use `aria-pressed`, and focus outlines are visible.

## Design decisions

- **Status is derived, not stored.** `getPaymentLinkStatus(link, now)` checks in this order:
  1. **Paid** if fully paid. Paid links never expire.
  2. **Expired** if `expiresAt <= now`. Expired wins over Active and Partially paid.
  3. **Partially paid** if anything has been paid.
  4. **Active** otherwise.

  A clock in `useNow` updates every 15 s, so links switch to Expired while the page is open.
- **One set of payment rules.** `getPaymentAmountError` (`src/lib/payments.ts`) is used by the record-payment form (through Yup) and by the service, so a stale UI cannot record an invalid payment. For example, if a link expires while the dialog is open, the service rejects the payment.
- **Payments are recorded individually.** Each link stores `amountPaidPaise` and a `payments` history. The amount due is worked out as `amount − paid`.
- **Persistence uses Zustand.** A vanilla Zustand store with the `persist` middleware stands in for the database, and only the service reads or writes it. If the stored data is corrupt, the app logs a warning and starts with an empty list instead of crashing.
- **Money is stored in integer paise.** Rupee strings are converted to paise with string arithmetic, which avoids floating-point errors.
- **Phone numbers must be Indian mobiles.** That means 10 digits starting 6–9, with an optional `+91`, `91` or `0` prefix. They are stored as `+91XXXXXXXXXX`.
- **The service layer is swappable.** The UI calls only `getPaymentLinks`, `createPaymentLink` and `recordPayment`, so a real HTTP client can replace the mock without UI changes.
- **There is no seed data.** A fresh browser starts with an empty list ("No payment links yet").

## Project structure

```
src/
  components/   create form, record-payment dialog, list table, status filter, status badge
  hooks/        usePaymentLinks (load/create/record state), useNow (ticking clock)
  lib/          status derivation + filtering, payment rules, formatting helpers
  validation/   Yup schemas (create link, record payment) and form → service-input mapping
  services/     mock payment links service + persisted Zustand store
  types/        domain types
e2e/            Playwright specs
```

## Tests

- `src/validation/paymentLinkSchema.test.ts` covers:
  - the amount, description, contact, expiry and minimum-first-payment boundaries
  - the record-payment schema
  - input normalisation
- `src/lib/status.test.ts` covers:
  - status derivation, including Expired beating Partially paid and Paid never expiring
  - filtering and counts
- `src/lib/payments.test.ts` covers the payment rules (amount due, first-payment minimum, full amount for non-partial links) and how payments add up.
- `src/services/paymentLinksService.test.ts` covers:
  - persistence across a simulated reload
  - recovery from corrupt storage
  - the service rejecting invalid, expired or already-paid payments
- `src/App.test.tsx` covers:
  - errors on an empty submit, with focus management
  - creating a link, then filtering
  - recording a partial payment through the dialog
  - full-amount-only links
- `e2e/payment-links.spec.ts` covers creating a link and then filtering it by status.
- `e2e/partial-payments.spec.ts` covers creating a partial link, rejecting a payment below the minimum, recording a partial payment, filtering to Partially paid, surviving a reload, and settling the rest so the link becomes Paid.

Both E2E specs run in desktop and mobile Chromium.
