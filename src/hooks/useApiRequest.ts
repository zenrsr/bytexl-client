import { useCallback, useEffect, useMemo, useState } from 'react';

import { ApiError } from '../api/client';
import {
  createSystemError,
  createUserInputError,
  logError,
} from '../lib/errors';
import type { RequestError } from '../lib/errors';

type UseApiRequestOptions = {
  immediate?: boolean;
  requestName?: string;
};

type UseApiRequestResult<T> = {
  data: T | null;
  error: RequestError | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
};

type NormalizationContext = {
  requestName?: string;
};

const DEFAULT_USER_HINT =
  'Double-check the information you entered and try again.';
const DEFAULT_SYSTEM_HINT =
  'Please try again shortly. If the problem continues, refresh the page.';

const isWeatherRequest = (requestName?: string) =>
  typeof requestName === 'string' && requestName.startsWith('weather');

const isCurrencyRequest = (requestName?: string) =>
  typeof requestName === 'string' && requestName.startsWith('currency');

const isQuotesRequest = (requestName?: string) =>
  typeof requestName === 'string' && requestName.startsWith('quotes');

const userHintForRequest = (requestName?: string) => {
  if (!requestName) {
    return DEFAULT_USER_HINT;
  }

  if (isWeatherRequest(requestName)) {
    return 'Verify the city, country code, or coordinates (for example, "Hyderabad,IN" or "17.3850,78.4867").';
  }

  if (isCurrencyRequest(requestName)) {
    return 'Enter a positive INR amount using digits only.';
  }

  return DEFAULT_USER_HINT;
};

const systemHintForRequest = (requestName?: string) => {
  if (!requestName) {
    return DEFAULT_SYSTEM_HINT;
  }

  if (isWeatherRequest(requestName)) {
    return 'The weather service may be temporarily unavailable. Please try again shortly.';
  }

  if (isCurrencyRequest(requestName)) {
    return 'The currency service may be temporarily unavailable. Please try again shortly.';
  }

  if (isQuotesRequest(requestName)) {
    return 'The quotes service may be temporarily unavailable. Please try again shortly.';
  }

  return DEFAULT_SYSTEM_HINT;
};

const isTechnicalMessage = (message: string | undefined | null) => {
  if (!message) {
    return true;
  }

  const trimmed = message.trim();
  if (trimmed.length === 0) {
    return true;
  }

  return /request failed|upstream|not found$/i.test(trimmed);
};

const userMessageFallback = (status: number, context: NormalizationContext) => {
  if (status === 404) {
    if (isWeatherRequest(context.requestName)) {
      return 'We could not find weather data for that location.';
    }

    return 'We could not find matching data for that request.';
  }

  return 'We could not process that request. Please review your input and try again.';
};

const systemMessageFallback = (status: number, context: NormalizationContext) => {
  if (status >= 500) {
    if (isWeatherRequest(context.requestName)) {
      return 'The weather service is unavailable right now.';
    }
    if (isCurrencyRequest(context.requestName)) {
      return 'The currency rates service is unavailable right now.';
    }
    if (isQuotesRequest(context.requestName)) {
      return 'The quotes service is unavailable right now.';
    }
    return 'The InfoHub service is unavailable right now.';
  }

  return 'We could not complete that request. Please try again shortly.';
};

const normalizeUserMessage = (
  status: number,
  context: NormalizationContext,
  message: string,
) => {
  if (isTechnicalMessage(message)) {
    return userMessageFallback(status, context);
  }

  return message;
};

const normalizeSystemMessage = (
  status: number,
  context: NormalizationContext,
  message: string,
) => {
  if (isTechnicalMessage(message)) {
    return systemMessageFallback(status, context);
  }

  return message;
};

const mapApiErrorToRequestError = (
  error: ApiError,
  context: NormalizationContext,
): RequestError => {
  const status = error.status ?? 0;

  if (status >= 400 && status < 500) {
    const code =
      status === 404 && isWeatherRequest(context.requestName)
        ? 'USER-LOCATION-NOT-FOUND'
        : status === 404
          ? 'USER-RESOURCE-NOT-FOUND'
          : 'USER-REQUEST-INVALID';

    const message = normalizeUserMessage(status, context, error.message);

    return createUserInputError(
      code,
      message,
      userHintForRequest(context.requestName),
      { status, requestName: context.requestName },
      error,
    );
  }

  if (status >= 500) {
    const message = normalizeSystemMessage(status, context, error.message);
    return createSystemError(
      'SYS-UPSTREAM-ERROR',
      message,
      systemHintForRequest(context.requestName),
      { status, requestName: context.requestName },
      error,
    );
  }

  if (status === 0) {
    return createSystemError(
      'SYS-NETWORK-ISSUE',
      error.message,
      'Check your internet connection and try again.',
      { requestName: context.requestName },
      error,
    );
  }

  const message = normalizeSystemMessage(status, context, error.message);
  return createSystemError(
    'SYS-UNEXPECTED-RESPONSE',
    message,
    systemHintForRequest(context.requestName),
    { status, requestName: context.requestName },
    error,
  );
};

const normalizeError = (error: unknown, context: NormalizationContext): RequestError => {
  if (error instanceof ApiError) {
    return mapApiErrorToRequestError(error, context);
  }

  if (error instanceof Error) {
    const message =
      typeof error.message === 'string' && error.message.trim().length > 0
        ? error.message
        : 'An unexpected problem prevented completing the request.';

    return createSystemError(
      'SYS-UNEXPECTED',
      message,
      systemHintForRequest(context.requestName),
      { requestName: context.requestName },
      error,
    );
  }

  return createSystemError(
    'SYS-UNKNOWN',
    'An unexpected issue prevented completing the request.',
    systemHintForRequest(context.requestName),
    { requestName: context.requestName, received: error },
  );
};

export function useApiRequest<T>(
  executor: () => Promise<T>,
  options: UseApiRequestOptions = {},
): UseApiRequestResult<T> {
  const { immediate = true, requestName } = options;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<RequestError | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(immediate);

  const run = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await executor();
      setData(result);
    } catch (caughtError) {
      const normalizedError = normalizeError(caughtError, { requestName });
      logError(normalizedError);
      setError(normalizedError);
    } finally {
      setIsLoading(false);
    }
  }, [executor, requestName]);

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
