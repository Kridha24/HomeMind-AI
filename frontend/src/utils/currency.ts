export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
}

export interface CountryDefaults {
  countryCode: string;
  countryName: string;
  currency: string;
  currencySymbol: string;
  timeZone: string;
  dateFormat: string;
  unitSystem: 'Metric' | 'Imperial';
  language: string;
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyInfo> = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar ($)' },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee (₹)' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro (€)' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound (£)' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen (¥)' },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar (C$)' },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar (A$)' },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar (S$)' },
  AED: { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham (د.إ)' },
  SAR: { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal (﷼)' },
  CHF: { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc (CHF)' },
  CNY: { code: 'CNY', symbol: '¥', name: 'Chinese Yuan (¥)' },
};

export const COUNTRY_DEFAULTS: Record<string, CountryDefaults> = {
  US: {
    countryCode: 'US',
    countryName: 'United States',
    currency: 'USD',
    currencySymbol: '$',
    timeZone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
    unitSystem: 'Imperial',
    language: 'English',
  },
  IN: {
    countryCode: 'IN',
    countryName: 'India',
    currency: 'INR',
    currencySymbol: '₹',
    timeZone: 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY',
    unitSystem: 'Metric',
    language: 'English',
  },
  GB: {
    countryCode: 'GB',
    countryName: 'United Kingdom',
    currency: 'GBP',
    currencySymbol: '£',
    timeZone: 'Europe/London',
    dateFormat: 'DD/MM/YYYY',
    unitSystem: 'Metric',
    language: 'English',
  },
  DE: {
    countryCode: 'DE',
    countryName: 'Germany',
    currency: 'EUR',
    currencySymbol: '€',
    timeZone: 'Europe/Berlin',
    dateFormat: 'DD.MM.YYYY',
    unitSystem: 'Metric',
    language: 'German',
  },
  JP: {
    countryCode: 'JP',
    countryName: 'Japan',
    currency: 'JPY',
    currencySymbol: '¥',
    timeZone: 'Asia/Tokyo',
    dateFormat: 'YYYY/MM/DD',
    unitSystem: 'Metric',
    language: 'Japanese',
  },
  CA: {
    countryCode: 'CA',
    countryName: 'Canada',
    currency: 'CAD',
    currencySymbol: 'C$',
    timeZone: 'America/Toronto',
    dateFormat: 'YYYY-MM-DD',
    unitSystem: 'Metric',
    language: 'English',
  },
  AU: {
    countryCode: 'AU',
    countryName: 'Australia',
    currency: 'AUD',
    currencySymbol: 'A$',
    timeZone: 'Australia/Sydney',
    dateFormat: 'DD/MM/YYYY',
    unitSystem: 'Metric',
    language: 'English',
  },
  SG: {
    countryCode: 'SG',
    countryName: 'Singapore',
    currency: 'SGD',
    currencySymbol: 'S$',
    timeZone: 'Asia/Singapore',
    dateFormat: 'DD/MM/YYYY',
    unitSystem: 'Metric',
    language: 'English',
  },
  AE: {
    countryCode: 'AE',
    countryName: 'United Arab Emirates',
    currency: 'AED',
    currencySymbol: 'د.إ',
    timeZone: 'Asia/Dubai',
    dateFormat: 'DD/MM/YYYY',
    unitSystem: 'Metric',
    language: 'Arabic',
  },
  SA: {
    countryCode: 'SA',
    countryName: 'Saudi Arabia',
    currency: 'SAR',
    currencySymbol: '﷼',
    timeZone: 'Asia/Riyadh',
    dateFormat: 'DD/MM/YYYY',
    unitSystem: 'Metric',
    language: 'Arabic',
  },
  CH: {
    countryCode: 'CH',
    countryName: 'Switzerland',
    currency: 'CHF',
    currencySymbol: 'CHF',
    timeZone: 'Europe/Zurich',
    dateFormat: 'DD.MM.YYYY',
    unitSystem: 'Metric',
    language: 'German',
  },
  CN: {
    countryCode: 'CN',
    countryName: 'China',
    currency: 'CNY',
    currencySymbol: '¥',
    timeZone: 'Asia/Shanghai',
    dateFormat: 'YYYY-MM-DD',
    unitSystem: 'Metric',
    language: 'Chinese',
  },
};

/**
 * Universal Currency Formatter
 * Dynamically formats any numeric value into the household's chosen currency
 */
export function formatCurrency(
  amount: number,
  currencyCode: string = 'USD',
  customSymbol?: string
): string {
  const symbol = customSymbol || SUPPORTED_CURRENCIES[currencyCode]?.symbol || '$';
  const val = isNaN(amount) ? 0 : amount;

  if (currencyCode === 'JPY') {
    return `${symbol}${Math.round(val).toLocaleString()}`;
  }

  return `${symbol}${val.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Resolves country default settings
 */
export function getCountryDefaults(countryCode: string): CountryDefaults {
  return COUNTRY_DEFAULTS[countryCode] || COUNTRY_DEFAULTS.US;
}
