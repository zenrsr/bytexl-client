import { useCallback, useMemo, useState } from 'react';

import type { CurrencyConversion } from '../../api/types';
import { useApiClient } from '../../app/apiContext';
import { ErrorBanner, LoadingIndicator } from '../../components/feedback';
import { useApiRequest } from '../../hooks/useApiRequest';
import { getErrorHeading, logError } from '../../lib/errors';
import type { RequestError } from '../../lib/errors';
import { validateCurrencyAmount } from '../../lib/validation';

const sanitizeAmountInput = (rawValue: string) => {
  let sanitized = rawValue.replace(/[^0-9.,-]/g, '');

  if (sanitized.includes('-')) {
    const withoutLeadingMinus = sanitized.replace(/-/g, '');
    const hasLeadingMinus = rawValue.trim().startsWith('-');
    sanitized = hasLeadingMinus ? `-${withoutLeadingMinus}` : withoutLeadingMinus;
  }

  const decimalIndex = sanitized.indexOf('.');
  if (decimalIndex !== -1) {
    sanitized =
      sanitized.slice(0, decimalIndex + 1) +
      sanitized
        .slice(decimalIndex + 1)
        .replace(/\./g, '');
  }

  return sanitized.replace(/,/g, '');
};

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
  const [inputError, setInputError] = useState<RequestError | null>(null);
  const [formatWarning, setFormatWarning] = useState<string | null>(null);

  const api = useApiClient();

  const fetchConversion = useCallback(
    () => api.convertCurrency(selectedAmount),
    [api, selectedAmount],
  );

  const { data, error, isLoading, refetch } = useApiRequest(fetchConversion, {
    requestName: 'currency.conversion',
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateCurrencyAmount(amountInput);

    if (!validation.valid) {
      setInputError(validation.error);
      logError(validation.error);
      return;
    }

    const normalizedAmount = validation.value;

    setInputError(null);
    setAmountInput(String(normalizedAmount));

    if (normalizedAmount === selectedAmount) {
      await refetch();
      return;
    }

    setSelectedAmount(normalizedAmount);
  };

  const amountErrorId = inputError ? 'inr-amount-error' : undefined;
  const amountFormatId = formatWarning ? 'inr-amount-format-warning' : undefined;
  const amountDescribedBy = [amountFormatId, amountErrorId]
    .reduce<string[]>((acc, id) => {
      if (id) {
        acc.push(id);
      }
      return acc;
    }, ['inr-amount-help'])
    .join(' ');

  return (
    <div className="module">
      <form className="module__form" onSubmit={handleSubmit}>
        <label htmlFor="inr-amount" className="module__label">
          INR amount:
        </label>
        <div className="module__controls">
          {formatWarning ? (
            <p
              id={amountFormatId}
              className="input-error"
              role="status"
              aria-live="polite"
            >
              {formatWarning}
            </p>
          ) : null}
          <input
            id="inr-amount"
            name="amount"
            inputMode="decimal"
            value={amountInput}
            onChange={(event) => {
              const sanitized = sanitizeAmountInput(event.target.value);
              setAmountInput(sanitized);
              if (sanitized !== event.target.value) {
                setFormatWarning('Only numbers and decimal values are allowed.');
              } else if (formatWarning) {
                setFormatWarning(null);
              }
              if (inputError) {
                setInputError(null);
              }
            }}
            className="input"
            placeholder="Enter amount in INR"
            aria-describedby={amountDescribedBy}
            aria-invalid={inputError || formatWarning ? 'true' : 'false'}
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
        {inputError ? (
          <ErrorBanner
            id={amountErrorId}
            title="Update the amount"
            message={inputError.message}
            hint={inputError.hint}
            code={inputError.code}
          />
        ) : null}
      </form>

      {isLoading ? <LoadingIndicator message="Updating exchange rates…" /> : null}
      {error ? (
        <ErrorBanner
          title={getErrorHeading(error)}
          message={error.message}
          hint={error.hint}
          code={error.code}
        />
      ) : null}
      {!isLoading && !error && data ? <CurrencyResults conversion={data} /> : null}
    </div>
  );
}
