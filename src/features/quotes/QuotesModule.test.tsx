import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import type { Quote } from '../../api/types';
import { createApiClientMock, renderWithApiClient } from '../../test/testUtils';
import { QuotesModule } from './QuotesModule';

const mockQuote = (text: string): Quote => ({
  text,
  author: 'Test Author',
  source: 'mock',
});

describe('QuotesModule', () => {
  it('renders a quote from the API', async () => {
    const mockApi = createApiClientMock({
      getQuote: vi.fn().mockResolvedValue(mockQuote('Stay focused.')),
    });

    renderWithApiClient(<QuotesModule />, mockApi);

    expect(await screen.findByText(/Stay focused\./i)).toBeInTheDocument();
    expect(mockApi.getQuote).toHaveBeenCalledTimes(1);
  });

  it('requests a new quote when the user clicks the button', async () => {
    const mockApi = createApiClientMock({
      getQuote: vi
        .fn()
        .mockResolvedValueOnce(mockQuote('Stay focused.'))
        .mockResolvedValueOnce(mockQuote('Keep shipping.')),
    });

    renderWithApiClient(<QuotesModule />, mockApi);
    await screen.findByText(/Stay focused/i);

    await userEvent.click(screen.getByRole('button', { name: /new quote/i }));
    expect(await screen.findByText(/Keep shipping/i)).toBeInTheDocument();
    expect(mockApi.getQuote).toHaveBeenCalledTimes(2);
  });

  it('shows an error when the quote API fails', async () => {
    const mockApi = createApiClientMock({
      getQuote: vi.fn().mockRejectedValue(new Error('Quote service unavailable')),
    });

    renderWithApiClient(<QuotesModule />, mockApi);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Quote service unavailable',
    );
  });
});
