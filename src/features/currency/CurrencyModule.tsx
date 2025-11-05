import { useCallback, useMemo, useState } from 'react';

import type { CurrencyConversion } from '../../api/types';
import { useApiClient } from '../../app/apiContext';
import { ErrorBanner, LoadingIndicator } from '../../components/feedback';
import { useApiRequest } from '../../hooks/useApiRequest';

function formatCurrency(value: number, currency: 'USD' | 'EUR') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

function CurrencyResults({ conversion }: { conversion: CurrencyConversion }) {
  const fetchedAt = useMemo(
    () => new Date(conversion.fetchedAt).toLocaleString(),
    [conversion.fetchedAt],
  );

  return (
    <section className="currency-card">
      <header className="currency-card__header">
        <h3>₹ {conversion.amount.toLocaleString('en-IN')}</h3>
        <span className="currency-card__fetched">Rates refreshed: {fetchedAt}</span>
      </header>

      <div className="currency-card__grid">
        <article className="currency-rate">
          <span className="currency-rate__label">USD</span>
          <span className="currency-rate__value">
            {formatCurrency(conversion.rates.usd, 'USD')}
          </span>
        </article>
        <article className="currency-rate">
          <span className="currency-rate__label">EUR</span>
          <span className="currency-rate__value">
            {formatCurrency(conversion.rates.eur, 'EUR')}
          </span>
        </article>
      </div>
    </section>
  );
}

export function CurrencyModule() {
  const [amountInput, setAmountInput] = useState('100');
  const [selectedAmount, setSelectedAmount] = useState<number>(100);
  const [inputError, setInputError] = useState<string | null>(null);

  const api = useApiClient();

  const fetchConversion = useCallback(
    () => api.convertCurrency(selectedAmount),
    [api, selectedAmount],
  );

  const { data, error, isLoading, refetch } = useApiRequest(fetchConversion);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = amountInput.trim();
    const parsed = Number(trimmed);

    if (!Number.isFinite(parsed) || parsed <= 0) {
      setInputError('Please enter a positive INR amount.');
      return;
    }

    setInputError(null);
    setAmountInput(trimmed);

    if (parsed === selectedAmount) {
      await refetch();
      return;
    }

    setSelectedAmount(parsed);
  };

  return (
    <div className="module">
      <form className="module__form" onSubmit={handleSubmit}>
        <label htmlFor="inr-amount" className="module__label">
          INR amount:
        </label>
        <div className="module__controls">
          <input
            id="inr-amount"
            name="amount"
            inputMode="decimal"
            value={amountInput}
            onChange={(event) => setAmountInput(event.target.value)}
            className="input"
            placeholder="Enter amount in INR"
            aria-describedby="inr-amount-help"
          />
          <button type="submit" className="button">
            Convert
          </button>
          <button
            type="button"
            className="button button--ghost"
            onClick={() => refetch()}
          >
            Refresh Rates
          </button>
        </div>
        <p id="inr-amount-help" className="module__help">
          Live conversion powered by the InfoHub currency API. Validation prevents invalid
          input.
        </p>
        {inputError ? <p className="input-error">{inputError}</p> : null}
      </form>

      {isLoading ? <LoadingIndicator message="Updating exchange rates…" /> : null}
      {error ? <ErrorBanner message={error} /> : null}
      {!isLoading && !error && data ? <CurrencyResults conversion={data} /> : null}
    </div>
  );
}
