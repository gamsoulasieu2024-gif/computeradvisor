"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Globe, Zap, AlertTriangle, Euro, DollarSign } from "lucide-react";
import { REGION_CONFIG, REGION_ENERGY_PRESETS, type RegionKey } from "@/lib/constants/regions";
import { calculateTCO } from "@/lib/utils/power-logic";
import { estimateLoad } from "@/lib/compatibility/power";
import { useBuild } from "@/hooks/use-build";
import { cn } from "@/lib/utils";

const REGION_STORAGE_KEY = "preferred-region";
const CURRENCY_STORAGE_KEY = "preferred-currency";
const HOURS_PER_DAY = 4;

function formatCurrency(value: number, currency: "USD" | "EUR"): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function PowerAnalytics() {
  const { selectedParts } = useBuild();
  const [region, setRegionState] = useState<RegionKey>("US");
  const [ratePresetIndex, setRatePresetIndex] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem(REGION_STORAGE_KEY) as RegionKey | null;
    if (saved === "US" || saved === "EU") {
      setRegionState(saved);
      return;
    }
    const currency = localStorage.getItem(CURRENCY_STORAGE_KEY);
    if (currency === "EUR") setRegionState("EU");
  }, []);

  const config = REGION_CONFIG[region];
  const rate =
    REGION_ENERGY_PRESETS[region][ratePresetIndex]?.rate ?? config.avgRate;

  const load = useMemo(
    () =>
      estimateLoad({
        cpu: selectedParts.cpu,
        gpu: selectedParts.gpu,
        ram: selectedParts.ram,
        storage: selectedParts.storage ?? [],
      }),
    [selectedParts]
  );

  const { wallDrawW, yearlyCost } = useMemo(
    () =>
      load > 0
        ? calculateTCO(
            load,
            config.efficiencyMultiplier,
            rate,
            HOURS_PER_DAY
          )
        : { wallDrawW: 0, yearlyCost: 0 },
    [load, config.efficiencyMultiplier, rate]
  );

  const overLimit = wallDrawW > config.circuitLimitW;
  const circuitPercent =
    config.circuitLimitW > 0
      ? Math.min(100, (wallDrawW / config.circuitLimitW) * 100)
      : 0;

  const setRegion = (next: RegionKey) => {
    setRegionState(next);
    const currency = REGION_CONFIG[next].currency;
    if (typeof window !== "undefined") {
      localStorage.setItem(REGION_STORAGE_KEY, next);
      localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
      window.dispatchEvent(
        new CustomEvent("currency-change", { detail: currency })
      );
    }
    setRatePresetIndex(0);
  };

  if (load <= 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-3 dark:border-zinc-800 dark:bg-zinc-900/30">
        <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Power & TCO
        </h3>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Add CPU, GPU, and other parts to see power draw and yearly cost.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
        <Globe className="h-4 w-4" />
        Power & TCO
      </h3>

      {/* Region toggle */}
      <div className="flex rounded-lg border border-zinc-200 bg-white p-0.5 dark:border-zinc-800 dark:bg-zinc-900/50">
        <button
          type="button"
          onClick={() => setRegion("US")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-xs font-medium transition-colors",
            region === "US"
              ? "bg-zinc-200 text-foreground dark:bg-zinc-700"
              : "text-zinc-600 hover:text-foreground dark:text-zinc-400"
          )}
        >
          <DollarSign className="h-3.5 w-3.5" />
          US (120V)
        </button>
        <button
          type="button"
          onClick={() => setRegion("EU")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-xs font-medium transition-colors",
            region === "EU"
              ? "bg-zinc-200 text-foreground dark:bg-zinc-700"
              : "text-zinc-600 hover:text-foreground dark:text-zinc-400"
          )}
        >
          <Euro className="h-3.5 w-3.5" />
          EU (230V)
        </button>
      </div>

      {/* Rate preset */}
      <div className="flex flex-wrap gap-1">
        {REGION_ENERGY_PRESETS[region].map((preset, i) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => setRatePresetIndex(i)}
            className={cn(
              "rounded px-2 py-1 text-xs transition-colors",
              ratePresetIndex === i
                ? "bg-zinc-200 dark:bg-zinc-700 text-foreground"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Wall draw & yearly cost */}
      <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="flex justify-between text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">Wall draw</span>
          <span className="font-medium">{wallDrawW} W</span>
        </div>
        {region === "US" && (
          <p className="mt-1 flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400" title="PSUs are ~3% less efficient on 120V circuits.">
            <AlertTriangle className="h-3 w-3 shrink-0" />
            PSUs are ~3% less efficient on 120V.
          </p>
        )}
        <div className="mt-2 flex justify-between text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">Yearly cost</span>
          <span className="font-medium">
            {formatCurrency(yearlyCost, config.currency)}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          ~{HOURS_PER_DAY} h/day under load
        </p>
      </div>

      {/* Circuit safety gauge */}
      <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-600 dark:text-zinc-400">Circuit load</span>
          <span className="font-medium">
            {wallDrawW} W / {config.circuitLimitW} W
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              overLimit ? "bg-error" : "bg-success"
            )}
            style={{ width: `${circuitPercent}%` }}
          />
        </div>
        {overLimit && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-error">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Continuous load exceeds typical {config.voltage}V circuit limit. Consider a dedicated circuit.
          </p>
        )}
      </div>
    </div>
  );
}
