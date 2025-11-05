import { useMemo } from 'react';

import { createApiClient } from '../api/client';
import { ApiContext } from './apiContext';

type ApiProviderProps = {
  baseUrl?: string;
  children: React.ReactNode;
};

export function ApiProvider({ baseUrl, children }: ApiProviderProps) {
  const resolvedBaseUrl =
    baseUrl ??
    (typeof import.meta !== 'undefined' ? import.meta.env.VITE_API_BASE_URL : undefined);

  const client = useMemo(
    () => createApiClient({ baseUrl: resolvedBaseUrl }),
    [resolvedBaseUrl],
  );

  return <ApiContext.Provider value={client}>{children}</ApiContext.Provider>;
}
