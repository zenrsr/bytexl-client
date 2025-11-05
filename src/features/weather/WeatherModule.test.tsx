import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import type { WeatherSummary } from '../../api/types';
import { createApiClientMock, renderWithApiClient } from '../../test/testUtils';
import { WeatherModule } from './WeatherModule';

const sampleWeather: WeatherSummary = {
  location: {
    name: 'Hyderabad',
    country: 'IN',
  },
  conditions: {
    temperatureC: 28.4,
    temperatureF: 83.12,
    description: 'scattered clouds',
    icon: '03d',
    humidity: 72,
  },
  observedAt: '2025-02-01T09:30:00.000Z',
};

describe('WeatherModule', () => {
  it('renders weather data after loading completes', async () => {
    const mockApi = createApiClientMock({
      getWeather: vi.fn().mockResolvedValue(sampleWeather),
    });

    renderWithApiClient(<WeatherModule />, mockApi);

    expect(await screen.findByText(/Hyderabad, IN/i)).toBeInTheDocument();
    expect(screen.getByText(/Temperature/i)).toBeInTheDocument();
    expect(mockApi.getWeather).toHaveBeenCalledTimes(1);
  });

  it('updates weather when user submits a new city', async () => {
    const mockApi = createApiClientMock({
      getWeather: vi
        .fn()
        .mockResolvedValueOnce(sampleWeather)
        .mockResolvedValueOnce({
          ...sampleWeather,
          location: { name: 'Mumbai', country: 'IN' },
        }),
    });

    renderWithApiClient(<WeatherModule />, mockApi);
    await screen.findByText(/Hyderabad, IN/i);

    await userEvent.clear(screen.getByPlaceholderText(/hyderabad/i));
    await userEvent.type(screen.getByPlaceholderText(/hyderabad/i), 'Mumbai,IN');
    await userEvent.click(screen.getByRole('button', { name: /update/i }));

    await waitFor(() => expect(mockApi.getWeather).toHaveBeenLastCalledWith('Mumbai,IN'));
    expect(await screen.findByText(/Mumbai, IN/i)).toBeInTheDocument();
  });

  it('shows error banner when request fails', async () => {
    const mockApi = createApiClientMock({
      getWeather: vi.fn().mockRejectedValue(new Error('Could not fetch weather data.')),
    });

    renderWithApiClient(<WeatherModule />, mockApi);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not fetch weather data.',
    );
  });
});
