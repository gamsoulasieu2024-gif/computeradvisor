"use client";

import { useState } from "react";
import { X, Zap, DollarSign, TrendingUp, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useCurrency } from "@/hooks/useCurrency";
import type { AutoFixPlan, FixStrategy } from "@/lib/recommendations/auto-fix";

interface AutoFixModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (plan: AutoFixPlan) => void;
  cheapestPlan: AutoFixPlan | null;
  performancePlan: AutoFixPlan | null;
  loading: boolean;
}

export function AutoFixModal({
  isOpen,
  onClose,
  onApply,
  cheapestPlan,
  performancePlan,
  loading,
}: AutoFixModalProps) {
  const [selectedStrategy, setSelectedStrategy] =
    useState<FixStrategy>("cheapest");
  const { format: formatPrice } = useCurrency();

  if (!isOpen) return null;

  const selectedPlan =
    selectedStrategy === "cheapest" ? cheapestPlan : performancePlan;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg bg-white dark:bg-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 p-6 dark:border-zinc-800">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-bold text-foreground">
              <Zap className="h-6 w-6 text-amber-500" />
              Auto-Fix Compatibility Issues
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Choose a strategy and preview changes before applying
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-foreground dark:hover:bg-zinc-800"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Strategy Selector */}
        <div className="border-b border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setSelectedStrategy("cheapest")}
              className={`rounded-lg border-2 p-4 text-left transition-all ${
                selectedStrategy === "cheapest"
                  ? "border-foreground bg-foreground/10"
                  : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-600"
              }`}
            >
              <div className="mb-2 flex items-start justify-between">
                <DollarSign
                  className={`h-6 w-6 ${
                    selectedStrategy === "cheapest"
                      ? "text-foreground"
                      : "text-zinc-500"
                  }`}
                />
                {selectedStrategy === "cheapest" && (
                  <Badge variant="success">Selected</Badge>
                )}
              </div>
              <h3 className="font-semibold text-foreground">Budget Friendly</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Cheapest fixes to make your build compatible
              </p>
              {cheapestPlan && (
                <div className="mt-3 border-t border-zinc-200 pt-3 dark:border-zinc-700">
                  <div className="text-sm">
                    <span className="text-zinc-500">Price impact: </span>
                    <span
                      className={`font-medium ${
                        cheapestPlan.totalPriceImpact > 0
                          ? "text-red-500"
                          : "text-green-600 dark:text-green-400"
                      }`}
                    >
                      {cheapestPlan.totalPriceImpact > 0 ? "+" : ""}
                      {formatPrice(Math.abs(cheapestPlan.totalPriceImpact))}
                    </span>
                  </div>
                  <div className="mt-1 text-sm">
                    <span className="text-zinc-500">Fixes: </span>
                    <span className="font-medium text-foreground">
                      {cheapestPlan.fixes.length} changes
                    </span>
                  </div>
                </div>
              )}
            </button>

            <button
              type="button"
              onClick={() => setSelectedStrategy("performance")}
              className={`rounded-lg border-2 p-4 text-left transition-all ${
                selectedStrategy === "performance"
                  ? "border-foreground bg-foreground/10"
                  : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-600"
              }`}
            >
              <div className="mb-2 flex items-start justify-between">
                <TrendingUp
                  className={`h-6 w-6 ${
                    selectedStrategy === "performance"
                      ? "text-foreground"
                      : "text-zinc-500"
                  }`}
                />
                {selectedStrategy === "performance" && (
                  <Badge variant="success">Selected</Badge>
                )}
              </div>
              <h3 className="font-semibold text-foreground">Best Performance</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Optimal fixes prioritizing performance and quality
              </p>
              {performancePlan && (
                <div className="mt-3 border-t border-zinc-200 pt-3 dark:border-zinc-700">
                  <div className="text-sm">
                    <span className="text-zinc-500">Price impact: </span>
                    <span
                      className={`font-medium ${
                        performancePlan.totalPriceImpact > 0
                          ? "text-red-500"
                          : "text-green-600 dark:text-green-400"
                      }`}
                    >
                      {performancePlan.totalPriceImpact > 0 ? "+" : ""}
                      {formatPrice(Math.abs(performancePlan.totalPriceImpact))}
                    </span>
                  </div>
                  <div className="mt-1 text-sm">
                    <span className="text-zinc-500">Fixes: </span>
                    <span className="font-medium text-foreground">
                      {performancePlan.fixes.length} changes
                    </span>
                  </div>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Changes Preview */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="py-12 text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
              <p className="text-zinc-500">Analyzing fixes...</p>
            </div>
          ) : selectedPlan ? (
            <div className="space-y-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-foreground">
                  Proposed Changes ({selectedPlan.fixes.length})
                </h3>
                <div className="text-sm">
                  <span className="text-zinc-500">Total: </span>
                  <span
                    className={`font-bold ${
                      selectedPlan.totalPriceImpact > 0
                        ? "text-red-500"
                        : "text-green-600 dark:text-green-400"
                    }`}
                  >
                    {selectedPlan.totalPriceImpact > 0 ? "+" : ""}
                    {formatPrice(Math.abs(selectedPlan.totalPriceImpact))}
                  </span>
                </div>
              </div>

              {selectedPlan.fixes.map((fix, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <Badge
                          variant={
                            fix.action === "replace"
                              ? "warning"
                              : fix.action === "add"
                                ? "success"
                                : "error"
                          }
                        >
                          {fix.action}
                        </Badge>
                        <span className="text-sm font-medium uppercase text-zinc-500">
                          {fix.category}
                        </span>
                      </div>

                      {fix.oldPart && fix.newPart && (
                        <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-3">
                          <div className="text-sm">
                            <div className="font-medium text-foreground line-through opacity-60">
                              {fix.oldPart.name}
                            </div>
                            {(fix.oldPart as { price_usd?: number }).price_usd !=
                              null && (
                              <div className="text-zinc-500">
                                {formatPrice(
                                  (fix.oldPart as { price_usd?: number })
                                    .price_usd ?? 0
                                )}
                              </div>
                            )}
                          </div>
                          <ChevronRight className="h-5 w-5 text-zinc-500" />
                          <div className="text-sm">
                            <div className="font-medium text-foreground">
                              {fix.newPart.name}
                            </div>
                            {(fix.newPart as { price_usd?: number }).price_usd !=
                              null && (
                              <div className="text-foreground">
                                {formatPrice(
                                  (fix.newPart as { price_usd?: number })
                                    .price_usd ?? 0
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                        {fix.reason}
                      </div>

                      <div className="mt-2 flex gap-3">
                        {fix.priceImpact !== undefined && (
                          <div className="text-xs">
                            <span className="text-zinc-500">Price: </span>
                            <span
                              className={`font-medium ${
                                fix.priceImpact > 0
                                  ? "text-red-500"
                                  : "text-green-600 dark:text-green-400"
                              }`}
                            >
                              {fix.priceImpact > 0 ? "+" : ""}
                              {formatPrice(Math.abs(fix.priceImpact))}
                            </span>
                          </div>
                        )}
                        {fix.performanceImpact && (
                          <div className="text-xs">
                            <span className="text-zinc-500">Performance: </span>
                            <span
                              className={`font-medium ${
                                fix.performanceImpact === "better"
                                  ? "text-green-600 dark:text-green-400"
                                  : fix.performanceImpact === "worse"
                                    ? "text-amber-600 dark:text-amber-400"
                                    : "text-zinc-500"
                              }`}
                            >
                              {fix.performanceImpact}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {selectedPlan.issuesRemaining.length > 0 && (
                <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
                  <h4 className="mb-2 font-medium text-amber-900 dark:text-amber-100">
                    Cannot Auto-Fix ({selectedPlan.issuesRemaining.length})
                  </h4>
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    Some issues require manual review or don&apos;t have suitable
                    automatic fixes in the current catalog.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-zinc-500">No fix plan available</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900/50">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => selectedPlan && onApply(selectedPlan)}
            disabled={!selectedPlan || selectedPlan.fixes.length === 0}
          >
            <Zap className="mr-2 h-4 w-4" />
            Apply Fixes
          </Button>
        </div>
      </div>
    </div>
  );
}
