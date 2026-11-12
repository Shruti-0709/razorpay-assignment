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
});
