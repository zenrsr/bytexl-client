import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import type { CurrencyConversion } from '../../api/types';
import { createApiClientMock, renderWithApiClient } from '../../test/testUtils';
import { CurrencyModule } from './CurrencyModule';

const sampleConversion = (amount: number): CurrencyConversion => ({
  base: 'INR',
  amount,
  rates: {
    usd: amount * 0.012,
    eur: amount * 0.011,
  },
  fetchedAt: '2025-02-01T09:30:00.000Z',
});

describe('CurrencyModule', () => {
  it('renders converted values after load', async () => {
    const mockApi = createApiClientMock({
      convertCurrency: vi.fn().mockResolvedValue(sampleConversion(100)),
    });

    renderWithApiClient(<CurrencyModule />, mockApi);

    expect(await screen.findByText(/₹ 100/)).toBeInTheDocument();
    expect(screen.getByText(/\$1\.20/)).toBeInTheDocument();
    expect(screen.getByText(/€1\.10/)).toBeInTheDocument();
  });

  it('validates user input before requesting new conversion', async () => {
    const mockApi = createApiClientMock({
      convertCurrency: vi
        .fn()
        .mockResolvedValueOnce(sampleConversion(100))
        .mockResolvedValueOnce(sampleConversion(250)),
    });

    renderWithApiClient(<CurrencyModule />, mockApi);
    await screen.findByText(/₹ 100/);

    const amountInput = screen.getByPlaceholderText(/enter amount/i);
    await userEvent.clear(amountInput);
    await userEvent.type(amountInput, '-50');
    await userEvent.click(screen.getByRole('button', { name: /convert/i }));

    const validationAlert = screen.getByRole('alert', { name: /update the amount/i });
    expect(validationAlert).toHaveTextContent('USER-CURRENCY-AMOUNT-RANGE');
    expect(validationAlert).toHaveTextContent('Amounts must be greater than zero.');
    expect(mockApi.convertCurrency).toHaveBeenCalledTimes(1);

    await userEvent.clear(amountInput);
    await userEvent.type(amountInput, '250');
    await userEvent.click(screen.getByRole('button', { name: /convert/i }));

    await screen.findByText(/₹ 250/);
    expect(mockApi.convertCurrency).toHaveBeenCalledWith(250);
  });

  it('warns inline when non-numeric characters are entered', async () => {
    const mockApi = createApiClientMock({
      convertCurrency: vi.fn().mockResolvedValue(sampleConversion(100)),
    });

    renderWithApiClient(<CurrencyModule />, mockApi);
    await screen.findByText(/₹ 100/);

    const amountInput = screen.getByPlaceholderText(/enter amount/i) as HTMLInputElement;
    await userEvent.clear(amountInput);
    await userEvent.type(amountInput, 'ab');

    expect(
      await screen.findByText(/Only numbers and decimal values are allowed/i),
    ).toBeInTheDocument();
    expect(amountInput.value).toBe('');

    await userEvent.type(amountInput, '250');
    expect(screen.queryByText(/Only numbers and decimal values are allowed/i)).toBeNull();
    expect(amountInput.value).toBe('250');
  });

  it('surfaces API errors to the user', async () => {
    const mockApi = createApiClientMock({
      convertCurrency: vi
        .fn()
        .mockRejectedValue(new Error('Could not fetch currency data.')),
    });

    renderWithApiClient(<CurrencyModule />, mockApi);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not fetch currency data.',
    );
  });
});
