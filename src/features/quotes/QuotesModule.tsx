import { useCallback } from 'react';

import type { Quote } from '../../api/types';
import { useApiClient } from '../../app/apiContext';
import { ErrorBanner, LoadingIndicator } from '../../components/feedback';
import { useApiRequest } from '../../hooks/useApiRequest';
import { getErrorHeading } from '../../lib/errors';

function QuoteCard({ quote }: { quote: Quote }) {
  return (
    <article className="quote-card">
      <p className="quote-card__text">“{quote.text}”</p>
      <footer className="quote-card__footer">
        <span className="quote-card__author">— {quote.author}</span>
        {quote.source ? (
          <span className="quote-card__source">Source: {quote.source}</span>
        ) : null}
      </footer>
    </article>
  );
}

export function QuotesModule() {
  const api = useApiClient();

  const fetchQuote = useCallback(() => api.getQuote(), [api]);

  const { data, error, isLoading, refetch } = useApiRequest(fetchQuote, {
    requestName: 'quotes.random',
  });

  return (
    <div className="module">
      <div className="module__controls module__controls--compact">
        <button type="button" className="button" onClick={() => refetch()}>
          New Quote
        </button>
      </div>

      {isLoading ? <LoadingIndicator message="Finding something inspiring…" /> : null}
      {error ? (
        <ErrorBanner
          title={getErrorHeading(error)}
          message={error.message}
          hint={error.hint}
          code={error.code}
        />
      ) : null}
      {!isLoading && !error && data ? <QuoteCard quote={data} /> : null}
    </div>
  );
}
