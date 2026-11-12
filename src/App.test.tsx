import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import App from './App';
import { resetPaymentLinksStore } from './services/paymentLinksService';
import { MESSAGES } from './validation/paymentLinkSchema';

describe('Payment Links manager', () => {
  beforeEach(() => resetPaymentLinksStore([]));

  it('shows field errors on an empty submit and focuses the first invalid field', async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(await screen.findByText('No payment links yet')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Create payment link' }));

    expect(await screen.findByText(MESSAGES.amountRequired)).toBeInTheDocument();
    expect(screen.getByText(MESSAGES.descriptionRequired)).toBeInTheDocument();
    expect(screen.getByText(MESSAGES.contactRequired)).toBeInTheDocument();
    const amount = screen.getByLabelText('Amount');
    expect(amount).toHaveAttribute('aria-invalid', 'true');
    expect(amount).toHaveFocus();
    expect(screen.queryAllByTestId('payment-link-row')).toHaveLength(0);
  });

  it('creates a link, lists it as Active and filters it by status', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('No payment links yet');

    await user.type(screen.getByLabelText('Amount'), '2499.5');
    await user.type(screen.getByLabelText('Description'), 'Design retainer');
    await user.type(screen.getByLabelText('Phone'), '9876543210');
    await user.click(screen.getByRole('button', { name: 'Create payment link' }));

    expect(await screen.findByRole('status')).toHaveTextContent('₹2,499.50');
    const row = screen.getByTestId('payment-link-row');
    expect(within(row).getByText('Design retainer')).toBeInTheDocument();
    expect(within(row).getByText('+919876543210')).toBeInTheDocument();
    expect(within(row).getByText('Active')).toBeInTheDocument();
    expect(screen.getByLabelText('Amount')).toHaveValue('');

    const filters = screen.getByRole('group', { name: 'Filter by status' });
    await user.click(within(filters).getByRole('button', { name: /^Paid/ }));
    expect(screen.queryByText('Design retainer')).not.toBeInTheDocument();
    expect(screen.getByText('No paid links')).toBeInTheDocument();

    await user.click(within(filters).getByRole('button', { name: /^Active/ }));
    expect(within(filters).getByRole('button', { name: /^Active/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Design retainer')).toBeInTheDocument();
  });

  it('records a partial payment through the dialog and filters by Partially paid', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('No payment links yet');

    await user.type(screen.getByLabelText('Amount'), '1000');
    await user.type(screen.getByLabelText('Description'), 'Instalment plan');
    await user.type(screen.getByLabelText('Email'), 'buyer@example.com');
    await user.click(screen.getByLabelText('Allow partial payments'));
    await user.type(screen.getByLabelText('Minimum first payment'), '250');
    await user.click(screen.getByRole('button', { name: 'Create payment link' }));

    const row = await screen.findByTestId('payment-link-row');
    await user.click(within(row).getByRole('button', { name: /^Record payment/ }));
    const dialog = screen.getByRole('dialog', { name: 'Record payment' });

    // Below the minimum first payment.
    await user.type(within(dialog).getByLabelText('Payment amount'), '100');
    await user.click(within(dialog).getByRole('button', { name: 'Record payment' }));
    expect(await within(dialog).findByText(/First payment must be at least ₹250\.00/)).toBeInTheDocument();

    await user.clear(within(dialog).getByLabelText('Payment amount'));
    await user.type(within(dialog).getByLabelText('Payment amount'), '400');
    await user.click(within(dialog).getByRole('button', { name: 'Record payment' }));

    expect(await screen.findByText(/Payment of ₹400\.00 recorded/)).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    const updatedRow = screen.getByTestId('payment-link-row');
    expect(within(updatedRow).getByText('Partially paid')).toBeInTheDocument();
    expect(within(updatedRow).getByTestId('paid-due')).toHaveTextContent('₹400.00 paid₹600.00 due');

    const filters = screen.getByRole('group', { name: 'Filter by status' });
    await user.click(within(filters).getByRole('button', { name: /^Partially paid/ }));
    expect(screen.getByText('Instalment plan')).toBeInTheDocument();
    await user.click(within(filters).getByRole('button', { name: /^Active/ }));
    expect(screen.queryByText('Instalment plan')).not.toBeInTheDocument();
  });

  it('requires the full amount due on links without partial payments', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('No payment links yet');

    await user.type(screen.getByLabelText('Amount'), '750');
    await user.type(screen.getByLabelText('Description'), 'One-off');
    await user.type(screen.getByLabelText('Phone'), '9876543210');
    await user.click(screen.getByRole('button', { name: 'Create payment link' }));

    const row = await screen.findByTestId('payment-link-row');
    await user.click(within(row).getByRole('button', { name: /^Record payment/ }));
    const dialog = screen.getByRole('dialog', { name: 'Record payment' });
    const amount = within(dialog).getByLabelText('Payment amount');
    expect(amount).toHaveValue('750.00');
    expect(amount).toHaveAttribute('readonly');

    await user.click(within(dialog).getByRole('button', { name: 'Record payment' }));
    expect(await within(screen.getByTestId('payment-link-row')).findByText('Paid')).toBeInTheDocument();
    expect(within(screen.getByTestId('payment-link-row')).queryByRole('button', { name: /^Record payment/ })).not.toBeInTheDocument();
  });
});
