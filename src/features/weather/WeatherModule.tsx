import { useCallback, useMemo, useState } from 'react';

import type { WeatherSummary } from '../../api/types';
import { useApiClient } from '../../app/apiContext';
import { LoadingIndicator, ErrorBanner } from '../../components/feedback';
import { useApiRequest } from '../../hooks/useApiRequest';
import { getErrorHeading, logError } from '../../lib/errors';
import type { RequestError } from '../../lib/errors';
import { validateLocationInput } from '../../lib/validation';

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
  const [inputError, setInputError] = useState<RequestError | null>(null);

  const api = useApiClient();

  const fetchWeather = useCallback(
    () => api.getWeather(activeCity ? activeCity : undefined),
    [api, activeCity],
  );

  const { data, error, isLoading, refetch } = useApiRequest(fetchWeather, {
    requestName: 'weather.summary',
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateLocationInput(cityInput);

    if (!validation.valid) {
      setInputError(validation.error);
      logError(validation.error);
      return;
    }

    const normalizedCity = validation.value;
    setInputError(null);
    setActiveCity(normalizedCity);
    setCityInput(normalizedCity ?? '');
  };

  const cityErrorId = inputError ? 'weather-city-error' : undefined;
  const cityDescribedBy = inputError
    ? `weather-city-help ${cityErrorId}`
    : 'weather-city-help';

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
            onChange={(event) => {
              setCityInput(event.target.value);
              if (inputError) {
                setInputError(null);
              }
            }}
            placeholder="e.g., Hyderabad,IN"
            className="input"
            aria-describedby={cityDescribedBy}
            aria-invalid={inputError ? 'true' : 'false'}
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
              setInputError(null);
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
        <p id="weather-city-help" className="module__help">
          Use a city name like "Hyderabad,IN" or provide coordinates such as "17.3850,78.4867".
        </p>
        {inputError ? (
          <ErrorBanner
            id={cityErrorId}
            title="Update the location"
            message={inputError.message}
            hint={inputError.hint}
            code={inputError.code}
          />
        ) : null}
      </form>

      {isLoading ? <LoadingIndicator message="Fetching weather details…" /> : null}
      {error ? (
        <ErrorBanner
          title={getErrorHeading(error)}
          message={error.message}
          hint={error.hint}
          code={error.code}
        />
      ) : null}
      {!isLoading && !error && data ? <WeatherPanel summary={data} /> : null}
    </div>
  );
}
