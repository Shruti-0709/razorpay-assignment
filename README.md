# Payment Links Manager

A Payment Links manager for a merchant dashboard: create payment links with validation, list them with derived status (Active / Paid / Expired), and filter by status.

**Stack:** Vite · React 19 · TypeScript · Tailwind CSS v4 · Formik + Yup · lucide-react · Vitest + Testing Library · Playwright

> **Data is simulated.** There is no backend. Links are held in memory by a mock service (`src/services/paymentLinksService.ts`), seeded with demo data, and reset on page reload.

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
- **List**: amount, description, customer, status and created time, newest first. It is a table on desktop and stacked cards on mobile.
- **Status filter**: All / Active / Paid / Expired, with a count for each.
- **States**: loading, load error with retry, no links yet, no links for the selected filter, create success or failure, and inline field validation.
- **Accessibility**: every control has a label, errors are linked to their fields with `aria-describedby` and `aria-invalid`, focus moves to the first invalid field on submit, the filter buttons use `aria-pressed`, and focus outlines are visible.

## Design decisions

- **Status is derived, not stored.** `getPaymentLinkStatus(link, now)` returns `paid` if `paidAt` is set. Otherwise it returns `expired` if `expiresAt <= now`, and `active` in all other cases. A clock in `useNow` updates every 15 s, so links switch to Expired while the page is open. A paid link stays Paid after its expiry passes.
- **Money is stored in integer paise.** Rupee strings are converted to paise with string arithmetic, which avoids floating-point errors.
- **Phone numbers must be Indian mobiles.** That means 10 digits starting 6–9, with an optional `+91`, `91` or `0` prefix. They are stored as `+91XXXXXXXXXX`.
- **The service layer is swappable.** The UI calls only `getPaymentLinks` and `createPaymentLink`, so a real HTTP client can replace the mock without UI changes.
- **There is no "pay" action.** Paid links come only from the seeded demo data, because the brief does not define a payment flow.

## Project structure

```
src/
  components/   form, list table, status filter, status badge
  hooks/        usePaymentLinks (load/create state), useNow (ticking clock)
  lib/          status derivation + filtering, formatting helpers
  validation/   Yup schema and form → service-input mapping
  services/     mock payment links service (in memory)
  mocks/        seed data
  types/        domain types
e2e/            Playwright specs
```

## Tests

- `src/validation/paymentLinkSchema.test.ts` covers the amount, description, contact and expiry boundaries, and the input normalisation.
- `src/lib/status.test.ts` covers status derivation (expiry boundary, paid taking priority over expiry, time passing), filtering and counts.
- `src/App.test.tsx` covers errors on an empty submit with focus management, and creating a link then filtering the list.
- `e2e/payment-links.spec.ts` covers creating a link and then filtering it by status, in desktop and mobile Chromium.
