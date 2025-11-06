type FeedbackProps = {
  message: string;
};

export function LoadingIndicator({ message }: FeedbackProps) {
  return (
    <div className="loading-state" role="status">
      <span className="loading-state__spinner" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}

type ErrorBannerProps = {
  id?: string;
  title?: string;
  message: string;
  hint?: string;
  code?: string;
};

export function ErrorBanner({ id, title, message, hint, code }: ErrorBannerProps) {
  return (
    <div className="error-state" role="alert" aria-live="assertive" id={id}>
      {title ? <p className="error-state__title">{title}</p> : null}
      <p className="error-state__message">
        {code ? <span className="error-state__code">{code}: </span> : null}
        {message}
      </p>
      {hint ? <p className="error-state__hint">{hint}</p> : null}
    </div>
  );
}
