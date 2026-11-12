import { expect, test } from '@playwright/test';

test('partial payments: create, record a partial payment, filter, and survive a reload', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('No payment links yet')).toBeVisible();

  const description = `Instalments ${Date.now()}`;
  await page.getByLabel('Amount').fill('1000');
  await page.getByLabel('Description').fill(description);
  await page.getByLabel('Email').fill('buyer@example.com');
  await page.getByLabel('Allow partial payments').check();
  await page.getByLabel('Minimum first payment').fill('250');
  await page.getByRole('button', { name: 'Create payment link' }).click();

  const row = page.getByTestId('payment-link-row').filter({ hasText: description });
  await expect(row).toContainText('Active');

  // Record a first payment below the minimum, then a valid one.
  await row.getByRole('button', { name: /^Record payment/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Record payment' });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('Payment amount').fill('100');
  await dialog.getByRole('button', { name: 'Record payment' }).click();
  await expect(dialog).toContainText('First payment must be at least ₹250.00');
  await dialog.getByLabel('Payment amount').fill('400');
  await dialog.getByRole('button', { name: 'Record payment' }).click();
  await expect(dialog).toBeHidden();

  await expect(row).toContainText('Partially paid');
  await expect(row.getByTestId('paid-due')).toContainText('₹400.00 paid');
  await expect(row.getByTestId('paid-due')).toContainText('₹600.00 due');

  const filters = page.getByRole('group', { name: 'Filter by status' });
  await filters.getByRole('button', { name: /^Partially paid/ }).click();
  await expect(row).toHaveCount(1);
  await filters.getByRole('button', { name: /^Active/ }).click();
  await expect(row).toHaveCount(0);

  // Data survives a reload.
  await page.reload();
  await expect(row).toContainText('Partially paid');
  await expect(row.getByTestId('paid-due')).toContainText('₹600.00 due');

  // Settle the rest -> Paid, and the action disappears.
  await row.getByRole('button', { name: /^Record payment/ }).click();
  await dialog.getByLabel('Payment amount').fill('600');
  await dialog.getByRole('button', { name: 'Record payment' }).click();
  await expect(row).toContainText('Paid');
  await expect(row.getByRole('button', { name: /^Record payment/ })).toHaveCount(0);
});
