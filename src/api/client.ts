import type { CurrencyConversion, Quote, WeatherSummary } from './types';

const DEFAULT_BASE_URL = '/api';

type ApiClientOptions = {
  baseUrl?: string;
};

type ErrorPayload = {
  error?: string;
};

const normalizeBaseUrl = (rawBaseUrl: string) => {
  if (!rawBaseUrl) {
    return DEFAULT_BASE_URL;
  }
  return rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;
};

export function createApiClient(options: ApiClientOptions = {}) {
  const baseUrl = normalizeBaseUrl(options.baseUrl ?? DEFAULT_BASE_URL);

  const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
    const response = await fetch(`${baseUrl}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
      ...init,
    });

    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;
      try {
        const payload = (await response.json()) as ErrorPayload;
        if (payload?.error) {
          errorMessage = payload.error;
        }
      } catch {
        // ignore parse errors
      }
      throw new Error(errorMessage);
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
