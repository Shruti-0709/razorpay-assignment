import { expect, test } from '@playwright/test';

test('create a payment link, then filter the list by status', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Payment Links', level: 1 })).toBeVisible();

  const rows = page.getByTestId('payment-link-row');
  await expect(page.getByText('No payment links yet')).toBeVisible(); // fresh browser storage

  // A unique description so the assertion can't match seeded data.
  const description = `E2E invoice ${Date.now()}`;
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  const expiry = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}T${pad(
    tomorrow.getHours(),
  )}:${pad(tomorrow.getMinutes())}`;

  await page.getByLabel('Amount').fill('1250.75');
  await page.getByLabel('Description').fill(description);
  await page.getByLabel('Email').fill('buyer@example.com');
  await page.getByLabel('Expiry').fill(expiry);
  await page.getByRole('button', { name: 'Create payment link' }).click();

  await expect(page.getByRole('status').filter({ hasText: 'created' })).toContainText('₹1,250.75');

  const newRow = rows.filter({ hasText: description });
  await expect(newRow).toHaveCount(1);
  await expect(newRow).toContainText('Active');
  await expect(newRow).toContainText('buyer@example.com');

  const filters = page.getByRole('group', { name: 'Filter by status' });

  // Active: new link is present and every visible row is Active.
  await filters.getByRole('button', { name: /^Active/ }).click();
  await expect(newRow).toHaveCount(1);
  for (const row of await rows.all()) await expect(row).toContainText('Active');

  // Paid: the new (unpaid) link is filtered out.
  await filters.getByRole('button', { name: /^Paid/ }).click();
  await expect(newRow).toHaveCount(0);
  await expect(page.getByText('No paid links')).toBeVisible();

  // All: back again.
  await filters.getByRole('button', { name: /^All/ }).click();
  await expect(newRow).toHaveCount(1);
});
