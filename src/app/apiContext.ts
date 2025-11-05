import { createContext, useContext } from 'react';

import type { ApiClient } from '../api/client';

export const ApiContext = createContext<ApiClient | null>(null);

export function useApiClient() {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApiClient must be used within an ApiProvider');
  }
  return context;
}
