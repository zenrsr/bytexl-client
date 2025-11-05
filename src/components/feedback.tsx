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

export function ErrorBanner({ message }: FeedbackProps) {
  return (
    <div className="error-state" role="alert">
      <p>{message}</p>
    </div>
  );
}
