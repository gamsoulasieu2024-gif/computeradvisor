"use client";

import { Button } from "@/components/ui/Button";
import { RefreshCw } from "lucide-react";
import type { AlternativeBuild } from "@/lib/recommendations/engine";

interface AlternativesProps {
  alternatives: AlternativeBuild[];
  /** Apply first swap and go to builder (same as upgrade Apply) */
  onApply?: (partId: string, category: string) => void;
}

export function Alternatives({ alternatives, onApply }: AlternativesProps) {
  if (alternatives.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-zinc-400" />
          <h2 className="text-lg font-semibold">Alternatives</h2>
        </div>
        <p className="mt-2 text-sm text-zinc-500">
          No alternative builds suggested. Your configuration looks good.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <RefreshCw className="h-5 w-5" />
        <h2 className="text-lg font-semibold">Alternative Builds</h2>
      </div>
      <p className="text-sm text-zinc-500">
        Swap components for better scores
      </p>
      <div className="space-y-3">
        {alternatives.map((alt, i) => (
          <div
            key={i}
            className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/50"
          >
            <p className="font-medium">{alt.label}</p>
            <ul className="mt-2 space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
              {alt.swaps.map((s, j) => (
                <li key={j}>
                  {s.category}: {s.from} → {s.to}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-success">{alt.scoreImpact}</p>
            {alt.swaps[0] && (
              <Button
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={() => onApply?.(alt.swaps[0].toPartId, alt.swaps[0].category)}
              >
                View Build
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
