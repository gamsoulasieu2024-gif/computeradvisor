export type Currency =
  | "USD"
  | "EUR"
  | "GBP"
  | "CAD"
  | "AUD"
  | "JPY"
  | "CNY"
  | "INR";

export interface CurrencyInfo {
  code: Currency;
  symbol: string;
  name: string;
  /** How many units of this currency per 1 USD */
  rate: number;
}

// Hardcoded exchange rates (update periodically or use API)
// Updated: Feb 2026
export const CURRENCIES: Record<Currency, CurrencyInfo> = {
  USD: { code: "USD", symbol: "$", name: "US Dollar", rate: 1.0 },
  EUR: { code: "EUR", symbol: "€", name: "Euro", rate: 0.92 },
  GBP: { code: "GBP", symbol: "£", name: "British Pound", rate: 0.79 },
  CAD: { code: "CAD", symbol: "C$", name: "Canadian Dollar", rate: 1.36 },
  AUD: { code: "AUD", symbol: "A$", name: "Australian Dollar", rate: 1.53 },
  JPY: { code: "JPY", symbol: "¥", name: "Japanese Yen", rate: 149.5 },
  CNY: { code: "CNY", symbol: "¥", name: "Chinese Yuan", rate: 7.24 },
  INR: { code: "INR", symbol: "₹", name: "Indian Rupee", rate: 83.12 },
};

/**
 * Convert USD to target currency
 */
export function convertCurrency(
  amountUSD: number,
  targetCurrency: Currency
): number {
  const rate = CURRENCIES[targetCurrency].rate;
  return amountUSD * rate;
}

/**
 * Format price in given currency
 */
export function formatPrice(
  amountUSD: number,
  currency: Currency,
  decimals: number = 0
): string {
  const converted = convertCurrency(amountUSD, currency);
  const currencyInfo = CURRENCIES[currency];

  const useDecimals =
    currency === "JPY" || currency === "INR" ? 0 : decimals;

  return `${currencyInfo.symbol}${converted.toLocaleString(undefined, {
    minimumFractionDigits: useDecimals,
    maximumFractionDigits: useDecimals,
  })}`;
}

/**
 * Get currency from user's location (simple heuristic)
 */
export function getCurrencyFromLocation(location?: string): Currency {
  if (!location) return "USD";

  const loc = location.toLowerCase();

  if (loc.includes("uk") || loc.includes("britain") || loc.includes("england"))
    return "GBP";
  if (
    loc.includes("eu") ||
    loc.includes("germany") ||
    loc.includes("france") ||
    loc.includes("spain")
  )
    return "EUR";
  if (loc.includes("canada")) return "CAD";
  if (loc.includes("australia")) return "AUD";
  if (loc.includes("japan")) return "JPY";
  if (loc.includes("china")) return "CNY";
  if (loc.includes("india")) return "INR";

  return "USD";
}
