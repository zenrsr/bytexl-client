import { useCallback, useMemo, useState } from 'react';

import type { WeatherSummary } from '../../api/types';
import { useApiClient } from '../../app/apiContext';
import { LoadingIndicator, ErrorBanner } from '../../components/feedback';
import { useApiRequest } from '../../hooks/useApiRequest';

const ICON_BASE_URL = 'https://openweathermap.org/img/wn';

function WeatherPanel({ summary }: { summary: WeatherSummary }) {
  const iconUrl = summary.conditions.icon
    ? `${ICON_BASE_URL}/${summary.conditions.icon}@2x.png`
    : null;
  const observed = useMemo(
    () => new Date(summary.observedAt).toLocaleString(),
    [summary.observedAt],
  );

  return (
    <article className="weather-card">
      <header className="weather-card__header">
        <div>
          <h3>
            {summary.location.name}, {summary.location.country}
          </h3>
          <p className="weather-card__observed">Last updated: {observed}</p>
        </div>
        {iconUrl ? (
          <img
            src={iconUrl}
            alt={summary.conditions.description}
            className="weather-card__icon"
            width={80}
            height={80}
          />
        ) : null}
      </header>

      <section className="weather-card__metrics">
        <div className="weather-card__metric">
          <span className="weather-card__metric-label">Temperature</span>
          <span className="weather-card__metric-value">
            {summary.conditions.temperatureC.toFixed(1)}°C /{' '}
            {summary.conditions.temperatureF.toFixed(1)}°F
          </span>
        </div>
        <div className="weather-card__metric">
          <span className="weather-card__metric-label">Condition</span>
          <span className="weather-card__metric-value weather-card__metric-value--accent">
            {summary.conditions.description}
          </span>
        </div>
        <div className="weather-card__metric">
          <span className="weather-card__metric-label">Humidity</span>
          <span className="weather-card__metric-value">
            {summary.conditions.humidity !== null
              ? `${summary.conditions.humidity}%`
              : '—'}
          </span>
        </div>
      </section>
    </article>
  );
}

export function WeatherModule() {
  const [cityInput, setCityInput] = useState('');
  const [activeCity, setActiveCity] = useState<string | undefined>(undefined);

  const api = useApiClient();

  const fetchWeather = useCallback(
    () => api.getWeather(activeCity ? activeCity : undefined),
    [api, activeCity],
  );

  const { data, error, isLoading, refetch } = useApiRequest(fetchWeather);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = cityInput.trim();
    setActiveCity(trimmed.length > 0 ? trimmed : undefined);
  };

  return (
    <div className="module">
      <form className="module__form" onSubmit={handleSubmit}>
        <label htmlFor="weather-city" className="module__label">
          Enter a city (leave blank for default):
        </label>
        <div className="module__controls">
          <input
            id="weather-city"
            name="city"
            value={cityInput}
            onChange={(event) => setCityInput(event.target.value)}
            placeholder="e.g., Hyderabad,IN"
            className="input"
          />
          <button type="submit" className="button">
            Update
          </button>
          <button
            type="button"
            className="button button--ghost"
            onClick={() => {
              setCityInput('');
              setActiveCity(undefined);
            }}
          >
            Reset
          </button>
          <button
            type="button"
            className="button button--ghost"
            onClick={() => refetch()}
          >
            Refresh
          </button>
        </div>
      </form>

      {isLoading ? <LoadingIndicator message="Fetching weather details…" /> : null}
      {error ? <ErrorBanner message={error} /> : null}
      {!isLoading && !error && data ? <WeatherPanel summary={data} /> : null}
    </div>
  );
}
