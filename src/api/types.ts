export type WeatherSummary = {
  location: {
    name: string;
    country: string;
  };
  conditions: {
    temperatureC: number;
    temperatureF: number;
    description: string;
    icon: string | null;
    humidity: number | null;
  };
  observedAt: string;
};

export type CurrencyConversion = {
  base: 'INR';
  amount: number;
  rates: {
    usd: number;
    eur: number;
  };
  fetchedAt: string;
};

export type Quote = {
  text: string;
  author: string;
  source?: string;
};
