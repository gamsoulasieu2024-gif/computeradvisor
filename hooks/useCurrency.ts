"use client";

import { useState, useEffect } from "react";
import { formatPrice, type Currency } from "@/lib/currency/exchange-rates";

const STORAGE_KEY = "preferred-currency";

export function useCurrency() {
  const [currency, setCurrency] = useState<Currency>("USD");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Currency | null;
    if (saved && (["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "CNY", "INR"] as const).includes(saved)) {
      setCurrency(saved);
    }

    const handleCurrencyChange = (event: Event) => {
      const customEvent = event as CustomEvent<Currency>;
      setCurrency(customEvent.detail);
    };

    window.addEventListener("currency-change", handleCurrencyChange);
    return () =>
      window.removeEventListener("currency-change", handleCurrencyChange);
  }, []);

  const format = (amountUSD: number, decimals?: number) =>
    formatPrice(amountUSD, currency, decimals ?? 0);

  return { currency, format };
}
