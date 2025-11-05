import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { vi } from 'vitest';

import type { ApiClient } from '../api/client';
import { ApiContext } from '../app/apiContext';

export const createApiClientMock = (overrides: Partial<ApiClient> = {}): ApiClient => ({
  baseUrl: '/api',
  getWeather: vi.fn(),
  convertCurrency: vi.fn(),
  getQuote: vi.fn(),
  ...overrides,
});

export const renderWithApiClient = (ui: ReactElement, client: ApiClient) =>
  render(<ApiContext.Provider value={client}>{ui}</ApiContext.Provider>);
