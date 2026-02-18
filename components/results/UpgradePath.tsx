"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { TrendingUp } from "lucide-react";
import type { UpgradeSuggestion } from "@/lib/recommendations/engine";

interface UpgradePathProps {
  upgrades: UpgradeSuggestion[];
  onApply?: (partId: string, category: string) => void;
}

const BUDGETS = [
  { label: "Under $100", max: 100 },
  { label: "Under $200", max: 200 },
  { label: "Under $500", max: 500 },
];

export function UpgradePath({ upgrades, onApply }: UpgradePathProps) {
  const [activeBudget, setActiveBudget] = useState(0);
  const max = BUDGETS[activeBudget].max;

  const filtered = upgrades
    .filter((u) => u.priceDelta <= max && u.priceDelta > -50)
    .slice(0, 3);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-5 w-5" />
        <h2 className="text-lg font-semibold">Best Upgrades</h2>
      </div>

      <div className="flex gap-2">
        {BUDGETS.map((b, i) => (
          <button
            key={b.label}
            type="button"
            onClick={() => setActiveBudget(i)}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              activeBudget === i
                ? "bg-foreground text-background"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
            }`}
          >
            {b.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No upgrades in this budget range.
          </p>
        ) : (
          filtered.map((u) => (
            <div
              key={u.suggestedPart.id}
              className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/50"
            >
              <div>
                <p className="font-medium">{u.currentPartName} → {u.suggestedPart.name}</p>
                <p className="text-sm text-zinc-500">{u.reason}</p>
                <div className="mt-1 flex items-center gap-3 text-xs">
                  <span className="text-success">+{u.scoreDelta} score</span>
                  {u.priceDelta !== 0 && (
                    <span
                      className={
                        u.priceDelta > 0 ? "text-warning" : "text-success"
                      }
                    >
                      {u.priceDelta > 0 ? "+" : ""}${u.priceDelta}
                    </span>
                  )}
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onApply?.(u.suggestedPart.id, u.category)}
              >
                Apply
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
