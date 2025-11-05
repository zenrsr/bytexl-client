import { useCallback, useEffect, useMemo, useState } from 'react';

type UseApiRequestOptions = {
  immediate?: boolean;
};

type UseApiRequestResult<T> = {
  data: T | null;
  error: string | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
};

export function useApiRequest<T>(
  executor: () => Promise<T>,
  options: UseApiRequestOptions = {},
): UseApiRequestResult<T> {
  const { immediate = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(immediate);

  const run = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await executor();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error');
    } finally {
      setIsLoading(false);
    }
  }, [executor]);

  const refetch = useCallback(async () => {
    await run();
  }, [run]);

  useEffect(() => {
    if (immediate) {
      void run();
    }
  }, [immediate, run]);

  return useMemo(
    () => ({
      data,
      error,
      isLoading,
      refetch,
    }),
    [data, error, isLoading, refetch],
  );
}
