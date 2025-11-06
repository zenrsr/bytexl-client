export type ErrorCategory = 'user' | 'system';

export type RequestError = {
  code: string;
  message: string;
  hint?: string;
  category: ErrorCategory;
  context?: Record<string, unknown>;
  cause?: unknown;
};

type CreateErrorInput = {
  code: string;
  message: string;
  hint?: string;
  category: ErrorCategory;
  context?: Record<string, unknown>;
  cause?: unknown;
};

const defaultTitles: Record<ErrorCategory, string> = {
  user: 'Please review your input',
  system: 'We ran into a problem',
};

export const createRequestError = ({
  code,
  message,
  hint,
  category,
  context,
  cause,
}: CreateErrorInput): RequestError => ({
  code,
  message,
  hint,
  category,
  context,
  cause,
});

export const createUserInputError = (
  code: string,
  message: string,
  hint?: string,
  context?: Record<string, unknown>,
  cause?: unknown,
): RequestError =>
  createRequestError({
    code,
    message,
    hint,
    category: 'user',
    context,
    cause,
  });

export const createSystemError = (
  code: string,
  message: string,
  hint?: string,
  context?: Record<string, unknown>,
  cause?: unknown,
): RequestError =>
  createRequestError({
    code,
    message,
    hint,
    category: 'system',
    context,
    cause,
  });

export const logError = (error: RequestError) => {
  if (typeof console === 'undefined' || typeof console.error !== 'function') {
    return;
  }

  console.error(`[${error.code}] ${error.message}`, {
    hint: error.hint,
    category: error.category,
    context: error.context,
    cause: error.cause,
  });
};

export const getErrorHeading = (error: RequestError) => defaultTitles[error.category];
