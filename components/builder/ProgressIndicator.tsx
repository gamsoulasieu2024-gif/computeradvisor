"use client";

import { useMemo } from "react";
import { useBuild } from "@/hooks/use-build";
import { cn } from "@/lib/utils";
import type { PartCategory } from "@/lib/store/types";

const CATEGORIES: PartCategory[] = [
  "cpu",
  "gpu",
  "motherboard",
  "ram",
  "storage",
  "psu",
  "cooler",
  "case",
];

const TOTAL = 8; // CPU, GPU, Mobo, RAM, Storage, PSU, Cooler, Case (storage counts as 1 slot for progress)

export function ProgressIndicator() {
  const { selectedParts } = useBuild();

  const { selectedCount, labels } = useMemo(() => {
    let count = 0;
    const list: string[] = [];
    for (const cat of CATEGORIES) {
      const value = selectedParts[cat];
      if (cat === "storage") {
        if (selectedParts.storage?.length) {
          count += 1;
          list.push("Storage");
        }
      } else if (value) {
        count += 1;
        list.push(cat === "motherboard" ? "Motherboard" : cat.charAt(0).toUpperCase() + cat.slice(1));
      }
    }
    return { selectedCount: count, labels: list };
  }, [selectedParts]);

  const pct = Math.round((selectedCount / TOTAL) * 100);

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900/50">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">Build progress</span>
        <span className="text-zinc-500 dark:text-zinc-400">
          {selectedCount}/{TOTAL} components
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            pct === 100 ? "bg-success" : pct >= 50 ? "bg-foreground/80" : "bg-zinc-400 dark:bg-zinc-500"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      {labels.length > 0 && (
        <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          {labels.join(", ")}
        </p>
      )}
    </div>
  );
}
