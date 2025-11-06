import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiError, createApiClient } from './client';

const BASE_URL = 'https://example.test';

describe('createApiClient', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('surfaces error payload messages when provided by the API', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'City not found for that query.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const client = createApiClient({ baseUrl: BASE_URL });
    const request = client.getWeather('Atlantis');

    await expect(request).rejects.toBeInstanceOf(ApiError);
    await expect(request).rejects.toMatchObject({
      message: 'City not found for that query.',
      status: 404,
    });
  });

  it('falls back to a friendly message when the response lacks helpful details', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(null, {
        status: 404,
        statusText: 'Not Found',
      }),
    );

    const client = createApiClient({ baseUrl: BASE_URL });
    const request = client.getQuote();

    await expect(request).rejects.toBeInstanceOf(ApiError);
    await expect(request).rejects.toMatchObject({
      message:
        "We couldn't find any results for that request. Try adjusting what you entered and try again.",
      status: 404,
    });
  });

  it('maps network failures to a graceful message', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new TypeError('Failed to fetch'));

    const client = createApiClient({ baseUrl: BASE_URL });
    const request = client.convertCurrency(100);

    await expect(request).rejects.toBeInstanceOf(ApiError);
    await expect(request).rejects.toMatchObject({
      message: 'We could not reach the InfoHub service. Check your connection and retry.',
      status: 0,
    });
  });
});
