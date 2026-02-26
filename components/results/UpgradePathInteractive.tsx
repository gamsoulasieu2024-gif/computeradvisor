"use client";

import { useState, useEffect, useCallback } from "react";
import { TrendingUp, AlertTriangle, ChevronRight, Zap, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { useCurrency } from "@/hooks/useCurrency";
import { SCORE_EXPLANATIONS } from "@/lib/scoring/explanations-detailed";
import {
  generateUpgradePath,
  type UpgradeOption,
  type BuildForUpgrade,
  type CurrentScores,
} from "@/lib/recommendations/upgrade-path";
import type { Catalog } from "@/lib/recommendations/engine";

interface UpgradePathInteractiveProps {
  currentBuild: BuildForUpgrade;
  currentScores: CurrentScores;
  catalog: Catalog | null;
  onApply?: (upgrade: UpgradeOption) => void;
}

const BUDGET_OPTIONS = [100, 200, 500, 1000];
const MIN_BUDGET = 50;
const MAX_BUDGET = 10000;

function validateBudget(input: string): {
  valid: boolean;
  amount: number;
  message?: string;
} {
  const cleaned = input.replace(/[^0-9]/g, "");

  if (!cleaned) {
    return { valid: false, amount: 0, message: "Enter a budget amount" };
  }

  const amount = parseInt(cleaned, 10);

  if (amount < MIN_BUDGET) {
    return {
      valid: false,
      amount,
      message: `Budget too low for meaningful upgrades (minimum $${MIN_BUDGET})`,
    };
  }

  if (amount > MAX_BUDGET) {
    return {
      valid: false,
      amount,
      message: `Maximum budget is $${MAX_BUDGET.toLocaleString()}`,
    };
  }

  return { valid: true, amount };
}

export function UpgradePathInteractive({
  currentBuild,
  currentScores,
  catalog,
  onApply,
}: UpgradePathInteractiveProps) {
  const [budget, setBudget] = useState(200);
  const [customBudget, setCustomBudget] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [upgrades, setUpgrades] = useState<UpgradeOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewUpgrade, setPreviewUpgrade] = useState<UpgradeOption | null>(
    null
  );
  const { format: formatPrice } = useCurrency();

  const handleCustomBudgetChange = (value: string) => {
    const cleaned = value.replace(/[^0-9]/g, "");
    setCustomBudget(cleaned);
    if (!cleaned) {
      setIsCustom(false);
      return;
    }
    const result = validateBudget(cleaned);
    if (result.valid) {
      setBudget(result.amount);
      setIsCustom(true);
    }
  };

  const handlePresetBudget = (amount: number) => {
    setBudget(amount);
    setIsCustom(false);
    setCustomBudget("");
  };

  const loadUpgrades = useCallback(() => {
    if (!catalog) return;
    setLoading(true);
    try {
      const generated = generateUpgradePath(
        currentBuild,
        currentScores,
        budget,
        catalog
      );
      setUpgrades(generated);
    } catch (err) {
      console.error("Failed to generate upgrades:", err);
      setUpgrades([]);
    } finally {
      setLoading(false);
    }
  }, [currentBuild, currentScores, budget, catalog]);

  useEffect(() => {
    loadUpgrades();
  }, [loadUpgrades]);

  const handleApply = (upgrade: UpgradeOption) => {
    onApply?.(upgrade);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-5 w-5" />
        <h2 className="text-lg font-semibold">Best Upgrades</h2>
      </div>

      {/* Budget Selector */}
      <div>
        <h3 className="mb-3 font-semibold text-foreground">
          Your Upgrade Budget
        </h3>

        {/* Preset Buttons */}
        <div className="mb-3 grid grid-cols-4 gap-2">
          {BUDGET_OPTIONS.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => handlePresetBudget(amount)}
              className={`rounded-lg border-2 p-3 transition-all ${
                budget === amount && !isCustom
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="text-xl font-bold">{formatPrice(amount)}</div>
            </button>
          ))}
        </div>

        {/* Custom Budget Input */}
        <div className="relative">
          <label className="mb-2 block text-sm text-muted-foreground">
            Or enter custom amount:
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              inputMode="numeric"
              placeholder="Enter custom budget"
              value={customBudget}
              onChange={(e) => handleCustomBudgetChange(e.target.value)}
              className={`w-full rounded-lg border-2 bg-background py-3 pl-10 pr-4 text-foreground transition-all ${
                isCustom
                  ? "border-primary"
                  : "border-border focus:border-primary"
              }`}
            />
          </div>

          {/* Validation message */}
          {customBudget && (
            <div className="mt-2">
              {(() => {
                const result = validateBudget(customBudget);
                if (result.valid) {
                  return (
                    <p className="text-xs text-green-500">
                      ✓ Finding upgrades for {formatPrice(result.amount)}
                    </p>
                  );
                }
                if (result.amount > MAX_BUDGET) {
                  return (
                    <p className="text-xs text-red-500">
                      Maximum budget is {formatPrice(MAX_BUDGET)}
                    </p>
                  );
                }
                if (result.amount > 0 && result.amount < MIN_BUDGET) {
                  return (
                    <p className="text-xs text-yellow-500">
                      Minimum budget of {formatPrice(MIN_BUDGET)} recommended
                      for meaningful upgrades
                    </p>
                  );
                }
                return null;
              })()}
            </div>
          )}
        </div>

        {/* Active Budget Display (custom only) */}
        {isCustom && customBudget && validateBudget(customBudget).valid && (
          <div className="mt-4 rounded-lg border border-primary/20 bg-primary/10 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Active Budget:</span>
              <span className="text-lg font-bold text-primary">
                {formatPrice(budget)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Upgrades List */}
      <div>
        <h3 className="mb-3 font-semibold text-foreground">
          Best Upgrades Under {formatPrice(budget)}
        </h3>

        {loading ? (
          <div className="py-8 text-center">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
            <p className="text-sm text-muted-foreground">
              Finding best upgrades...
            </p>
          </div>
        ) : upgrades.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No upgrades found within {formatPrice(budget)} budget
          </div>
        ) : (
          <div className="space-y-3">
            {upgrades.slice(0, 5).map((upgrade, i) => (
              <div
                key={`${upgrade.category}-${upgrade.suggestedPart.id}-${i}`}
                className="rounded-lg border border-border p-4 transition-all hover:border-primary/50"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <Badge
                        variant={
                          upgrade.priority === "high"
                            ? "error"
                            : upgrade.priority === "medium"
                              ? "warning"
                              : "success"
                        }
                      >
                        {upgrade.priority} priority
                      </Badge>
                      <span className="text-sm font-medium uppercase text-zinc-500">
                        {upgrade.category}
                      </span>
                    </div>

                    <div className="mb-2 grid grid-cols-[1fr,auto,1fr] items-center gap-3">
                      <div className="text-sm text-zinc-500">
                        {upgrade.currentPart?.name ?? "None"}
                      </div>
                      <ChevronRight className="h-4 w-4 text-zinc-500" />
                      <div className="text-sm font-medium">
                        {upgrade.suggestedPart.name}
                      </div>
                    </div>

                    <p className="mb-3 text-sm text-zinc-500">
                      {upgrade.reason}
                    </p>

                    {/* Platform Change Warning */}
                    {upgrade.platformChange && (
                      <div className="mb-3 rounded border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-950">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="mt-0.5 h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                          <div className="flex-1 text-sm">
                            <div className="mb-1 font-medium text-yellow-900 dark:text-yellow-100">
                              Platform Change Required
                            </div>
                            <div className="mb-2 text-yellow-800 dark:text-yellow-200">
                              {upgrade.platformChange.warning}
                            </div>
                            <div className="space-y-1">
                              {upgrade.platformChange.additionalCosts.map(
                                (cost, j) => (
                                  <div
                                    key={j}
                                    className="flex justify-between text-xs"
                                  >
                                    <span>{cost.part}:</span>
                                    <span className="font-medium">
                                      +{formatPrice(cost.estimatedCost)}
                                    </span>
                                  </div>
                                )
                              )}
                              <div className="mt-1 flex justify-between border-t border-yellow-300 pt-1 text-xs font-bold dark:border-yellow-700">
                                <span>Total additional cost:</span>
                                <span>
                                  +{formatPrice(upgrade.platformChange.totalCost)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Score Impact */}
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div>
                        <div className="text-zinc-500">Overall</div>
                        <div
                          className={`font-bold ${
                            upgrade.scoreImpact.overall > 0
                              ? "text-green-500"
                              : "text-red-500"
                          }`}
                        >
                          {upgrade.scoreImpact.overall > 0 ? "+" : ""}
                          {upgrade.scoreImpact.overall.toFixed(0)}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Performance</div>
                        <div
                          className={`font-bold ${
                            upgrade.scoreImpact.performance > 0
                              ? "text-green-500"
                              : "text-zinc-500"
                          }`}
                        >
                          {upgrade.scoreImpact.performance > 0 ? "+" : ""}
                          {upgrade.scoreImpact.performance.toFixed(0)}
                        </div>
                      </div>
                      <div>
                        <div className="text-zinc-500">Value</div>
                        <div
                          className={`font-bold ${
                            upgrade.scoreImpact.value !== 0
                              ? "text-foreground"
                              : "text-muted-foreground"
                          }`}
                        >
                          {upgrade.scoreImpact.value > 0 ? "+" : ""}
                          {upgrade.scoreImpact.value.toFixed(0)}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="text-zinc-500">ROI</span>
                          <InfoTooltip
                            title={SCORE_EXPLANATIONS.roi.title}
                            content={SCORE_EXPLANATIONS.roi.content}
                            size="sm"
                          />
                        </div>
                        <div className="font-bold">
                          {upgrade.valueRating.toFixed(1)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 border-t border-zinc-200 pt-3 dark:border-zinc-700">
                  <div className="flex-1 text-right">
                    <span className="text-lg font-bold">
                      {formatPrice(
                        upgrade.cost +
                          (upgrade.platformChange?.totalCost ?? 0)
                      )}
                    </span>
                    {upgrade.platformChange && (
                      <span className="ml-1 text-xs text-zinc-500">
                        ({formatPrice(upgrade.cost)} +{" "}
                        {formatPrice(upgrade.platformChange.totalCost)} platform)
                      </span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setPreviewUpgrade(
                        previewUpgrade?.suggestedPart.id ===
                          upgrade.suggestedPart.id
                          ? null
                          : upgrade
                      )
                    }
                  >
                    Preview
                  </Button>
                  <Button size="sm" onClick={() => handleApply(upgrade)}>
                    <Zap className="mr-1 h-4 w-4" />
                    Apply
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Panel (inline) */}
      {previewUpgrade && (
        <div className="rounded-lg border-2 border-primary/50 bg-primary/5 p-4">
          <h4 className="mb-2 font-semibold">Preview: {previewUpgrade.suggestedPart.name}</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Before</div>
              <div className="text-xl font-bold">
                {currentScores.overall}
                <span className="ml-1 text-sm font-normal text-zinc-500">
                  overall
                </span>
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">After</div>
              <div className="text-xl font-bold text-green-600 dark:text-green-400">
                {currentScores.overall + previewUpgrade.scoreImpact.overall}
                <span className="ml-1 text-sm font-normal text-zinc-500">
                  overall
                </span>
              </div>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="mt-2"
            onClick={() => setPreviewUpgrade(null)}
          >
            Close preview
          </Button>
        </div>
      )}
    </div>
  );
}
