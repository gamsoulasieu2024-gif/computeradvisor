"use client";

import { useState, useEffect } from "react";
import { DollarSign, ChevronDown } from "lucide-react";
import { CURRENCIES, type Currency, type CurrencyInfo } from "@/lib/currency/exchange-rates";

export function CurrencySelector() {
  const [currency, setCurrency] = useState<Currency>("USD");
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("preferred-currency") as Currency | null;
    if (
      saved &&
      (["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "CNY", "INR"] as const).includes(saved)
    ) {
      setCurrency(saved);
      window.dispatchEvent(
        new CustomEvent("currency-change", { detail: saved })
      );
    }
  }, []);

  const handleSelectCurrency = (newCurrency: Currency) => {
    setCurrency(newCurrency);
    localStorage.setItem("preferred-currency", newCurrency);
    setShowMenu(false);
    window.dispatchEvent(
      new CustomEvent("currency-change", { detail: newCurrency })
    );
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-2 text-sm transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        aria-expanded={showMenu}
        aria-haspopup="listbox"
        aria-label="Select currency"
      >
        <DollarSign className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
        <span className="font-medium">{currency}</span>
        <ChevronDown className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
            aria-hidden
          />
          <div
            className="absolute right-0 z-50 mt-2 w-56 rounded-md border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
            role="listbox"
          >
            <div className="space-y-0.5 p-2">
              {Object.values(CURRENCIES).map((curr: CurrencyInfo) => (
                <button
                  key={curr.code}
                  type="button"
                  role="option"
                  aria-selected={currency === curr.code}
                  onClick={() => handleSelectCurrency(curr.code)}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors ${
                    currency === curr.code
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  <span className="font-medium">
                    {curr.symbol} {curr.code}
                  </span>
                  <span
                    className={
                      currency === curr.code
                        ? "text-white/80 dark:text-zinc-900/80"
                        : "text-zinc-500 dark:text-zinc-400"
                    }
                  >
                    {curr.name}
                  </span>
                </button>
              ))}
            </div>
            <div className="border-t border-zinc-200 p-2 dark:border-zinc-700">
              <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
                Rates updated Feb 2026
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
