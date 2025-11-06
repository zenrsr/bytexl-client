import type { CurrencyConversion, Quote, WeatherSummary } from './types';

const DEFAULT_BASE_URL = '/api';

type ApiClientOptions = {
  baseUrl?: string;
};

type ErrorPayload = {
  error?: string;
};

type FriendlyMessageByStatus = {
  notFound: string;
  client: string;
  server: string;
  network: string;
  generic: string;
};

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const normalizeBaseUrl = (rawBaseUrl?: string) => {
  const candidate = typeof rawBaseUrl === 'string' ? rawBaseUrl.trim() : '';
  if (candidate.length === 0) {
    return DEFAULT_BASE_URL;
  }
  return candidate.endsWith('/') ? candidate.slice(0, -1) : candidate;
};

const FRIENDLY_MESSAGES: FriendlyMessageByStatus = {
  notFound:
    "We couldn't find any results for that request. Try adjusting what you entered and try again.",
  client:
    'We could not process that request. Please review what you entered and try once more.',
  server:
    'The InfoHub service is having trouble right now. Please try again in a little while.',
  network:
    'We could not reach the InfoHub service. Check your connection and retry.',
  generic: 'Something went wrong while processing that request. Please try again.',
};

const pickFallbackMessage = (status?: number) => {
  if (!status) {
    return FRIENDLY_MESSAGES.network;
  }

  if (status === 404) {
    return FRIENDLY_MESSAGES.notFound;
  }

  if (status >= 400 && status < 500) {
    return FRIENDLY_MESSAGES.client;
  }

  if (status >= 500) {
    return FRIENDLY_MESSAGES.server;
  }

  return FRIENDLY_MESSAGES.generic;
};

const extractErrorMessage = async (response: Response) => {
  const contentType = response.headers.get('Content-Type') ?? '';
  if (!contentType.toLowerCase().includes('application/json')) {
    return null;
  }

  try {
    const payload = (await response.json()) as ErrorPayload;
    const message = typeof payload?.error === 'string' ? payload.error.trim() : '';
    return message.length > 0 ? message : null;
  } catch {
    return null;
  }
};

export function createApiClient(options: ApiClientOptions = {}) {
  const baseUrl = normalizeBaseUrl(options.baseUrl ?? DEFAULT_BASE_URL);

  const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
    let response: Response;

    try {
      response = await fetch(`${baseUrl}${path}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(init?.headers ?? {}),
        },
        ...init,
      });
    } catch (error) {
      throw new ApiError(FRIENDLY_MESSAGES.network, 0);
    }

    if (!response.ok) {
      const derivedMessage =
        (await extractErrorMessage(response)) ?? pickFallbackMessage(response.status);

      throw new ApiError(derivedMessage, response.status);
    }

    return response.json() as Promise<T>;
  };

  return {
    getWeather: (city?: string) => {
      const query = city ? `?city=${encodeURIComponent(city)}` : '';
      return request<WeatherSummary>(`/weather${query}`);
    },
    convertCurrency: (amount: number) => {
      const query = `?amount=${encodeURIComponent(amount)}`;
      return request<CurrencyConversion>(`/currency${query}`);
    },
    getQuote: () => request<Quote>('/quote'),
    baseUrl,
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
