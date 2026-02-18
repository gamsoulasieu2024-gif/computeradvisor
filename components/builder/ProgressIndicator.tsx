"use client";

import { useBuild } from "@/hooks/use-build";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  "cpu",
  "gpu",
  "motherboard",
  "ram",
  "storage",
  "psu",
  "cooler",
  "case",
] as const;

export function ProgressIndicator() {
  const { selectedParts } = useBuild();

  const storageCount = selectedParts.storage?.length ?? 0;
  const storageRequired = 1;

  const filled = CATEGORIES.filter((cat) => {
    if (cat === "storage") return storageCount >= storageRequired;
    const part = selectedParts[cat];
    return part != null;
  }).length;

  const total = CATEGORIES.length;
  const percent = Math.round((filled / total) * 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">Build Progress</span>
        <span className="text-zinc-500 dark:text-zinc-400">
          {filled}/{total} components
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            percent === 100
              ? "bg-success"
              : percent >= 75
                ? "bg-warning"
                : "bg-foreground/30"
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
      {percent < 100 && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Add at least CPU, motherboard, RAM, storage, PSU, and case
        </p>
      )}
    </div>
  );
}
