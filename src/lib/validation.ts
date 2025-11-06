import { createUserInputError } from './errors';
import type { RequestError } from './errors';

type ValidationSuccess<T> = {
  valid: true;
  value: T;
};

type ValidationFailure = {
  valid: false;
  error: RequestError;
};

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

const MAX_LOCATION_LENGTH = 80;

const coordinatePattern = /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/;
const cityPattern = /^[A-Za-z\s'.-]+(?:,[A-Za-z\s'.-]{2,})?$/;
const placeholderValues = new Set([
  'unknown',
  'unkown',
  'n/a',
  'na',
  'none',
  'null',
  'undefined',
  'test',
  'sample',
]);

export const validateLocationInput = (
  rawValue: string,
): ValidationResult<string | undefined> => {
  const trimmed = rawValue.trim();

  if (trimmed.length === 0) {
    return {
      valid: true,
      value: undefined,
    };
  }

  const lowerCased = trimmed.toLowerCase();

  if (placeholderValues.has(lowerCased)) {
    return {
      valid: false,
      error: createUserInputError(
        'USER-LOCATION-PLACEHOLDER',
        'The location looks like a placeholder value.',
        'Enter a real place such as "Hyderabad,IN" or coordinates like "17.3850,78.4867".',
        { value: trimmed },
      ),
    };
  }

  if (trimmed.length > MAX_LOCATION_LENGTH) {
    return {
      valid: false,
      error: createUserInputError(
        'USER-LOCATION-LENGTH',
        'Location descriptions must be 80 characters or fewer.',
        'Try shortening the location to something like "Hyderabad,IN" or a latitude/longitude pair.',
        { value: trimmed, length: trimmed.length },
      ),
    };
  }

  if (coordinatePattern.test(trimmed)) {
    const [latToken, lonToken] = trimmed.split(',');
    const latitude = Number(latToken.trim());
    const longitude = Number(lonToken.trim());

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return {
        valid: false,
        error: createUserInputError(
          'USER-LOCATION-COORDS-NUMERIC',
          'Latitude and longitude must be valid decimal numbers.',
          'Use decimal degrees such as "17.3850,78.4867".',
          { latitude: latToken, longitude: lonToken },
        ),
      };
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return {
        valid: false,
        error: createUserInputError(
          'USER-LOCATION-COORDS-RANGE',
          'Coordinates are outside the supported ranges (-90 to 90 for latitude, -180 to 180 for longitude).',
          'Check the values and submit something like "17.3850,78.4867".',
          { latitude, longitude },
        ),
      };
    }

    return {
      valid: true,
      value: trimmed,
    };
  }

  if (!cityPattern.test(trimmed)) {
    return {
      valid: false,
      error: createUserInputError(
        'USER-LOCATION-FORMAT',
        'We could not understand that location.',
        'Use "City" or "City,CountryCode" (for example, "Hyderabad,IN") or provide coordinates like "17.3850,78.4867".',
        { value: trimmed },
      ),
    };
  }

  if (trimmed.length < 3) {
    return {
      valid: false,
      error: createUserInputError(
        'USER-LOCATION-SHORT',
        'Location details are too short to search.',
        'Provide at least three characters, such as "Rio" or "Delhi,IN".',
        { value: trimmed },
      ),
    };
  }

  return {
    valid: true,
    value: trimmed,
  };
};

const MAX_AMOUNT = 10_000_000;

export const validateCurrencyAmount = (rawValue: string): ValidationResult<number> => {
  const trimmed = rawValue.trim().replace(/,/g, '');

  if (trimmed.length === 0) {
    return {
      valid: false,
      error: createUserInputError(
        'USER-CURRENCY-AMOUNT-MISSING',
        'Enter an amount in INR to convert.',
        'For example, try "100" or "2500".',
        { value: rawValue },
      ),
    };
  }

  const amount = Number(trimmed);

  if (!Number.isFinite(amount)) {
    return {
      valid: false,
      error: createUserInputError(
        'USER-CURRENCY-AMOUNT-NUMERIC',
        'Amounts must be numbers.',
        'Use digits only, such as "100" or "2500".',
        { value: rawValue },
      ),
    };
  }

  if (amount <= 0) {
    return {
      valid: false,
      error: createUserInputError(
        'USER-CURRENCY-AMOUNT-RANGE',
        'Amounts must be greater than zero.',
        'Enter a positive value like "100" or "2500".',
        { amount },
      ),
    };
  }

  if (amount > MAX_AMOUNT) {
    return {
      valid: false,
      error: createUserInputError(
        'USER-CURRENCY-AMOUNT-LIMIT',
        'We can only convert up to 10,000,000 INR at once.',
        'Try a smaller amount or split the conversion into multiple requests.',
        { amount, max: MAX_AMOUNT },
      ),
    };
  }

  return {
    valid: true,
    value: amount,
  };
};
