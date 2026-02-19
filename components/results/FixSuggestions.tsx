"use client";

import { AlertCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Issue } from "@/lib/compatibility/types";
import type { UpgradeSuggestion } from "@/lib/recommendations/engine";

interface FixSuggestionsProps {
  topIssues: Issue[];
  upgrades: UpgradeSuggestion[];
  onApplyUpgrade?: (partId: string) => void;
}

const ISSUE_FIX_MAP: Record<
  string,
  (_issue: Issue) => string[]
> = {
  gpuTooLong: () => [
    "Switch to a shorter GPU",
    "Choose a larger case with more GPU clearance",
  ],
  coolerTooTall: () => [
    "Use a shorter cooler",
    "Choose a case with more CPU cooler height",
  ],
  insufficientPower: () => [
    "Upgrade to a higher wattage PSU",
    "Remove power-hungry components",
  ],
  lowPsuHeadroom: () => [
    "Upgrade to a PSU with 25%+ headroom",
    "Consider a more efficient PSU",
  ],
  socketMismatch: () => ["Select a CPU that matches your motherboard socket"],
  ramTypeMismatch: () => [
    "Select RAM that matches motherboard memory type (DDR4/DDR5)",
  ],
  noM2Slots: () => [
    "Use fewer NVMe drives",
    "Select a motherboard with more M.2 slots",
  ],
};

export function FixSuggestions({
  topIssues,
  upgrades,
  onApplyUpgrade,
}: FixSuggestionsProps) {
  const suggestions: { issueId: string; title: string; fixes: string[]; upgrade?: UpgradeSuggestion }[] = [];

  for (const issue of topIssues.slice(0, 3)) {
    const staticFixes = ISSUE_FIX_MAP[issue.id]?.(issue) ?? issue.suggestedFixes ?? [];
    const related = upgrades.find(
      (u) => u.currentPartId && issue.affectedParts?.includes(u.currentPartId)
    );
    suggestions.push({
      issueId: issue.id,
      title: issue.title,
      fixes: related
        ? [...staticFixes, `Or apply: ${related.suggestedPart.name}`]
        : staticFixes,
      upgrade: related,
    });
  }

  if (suggestions.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Fix Suggestions</h2>
      {suggestions.map((s) => (
        <div
          key={s.issueId}
          className={cn(
            "rounded-xl border p-4",
            s.title.includes("Critical") || s.issueId === "gpuTooLong"
              ? "border-error/30 bg-error/5"
              : "border-warning/30 bg-warning/5"
          )}
        >
          <div className="flex items-start gap-3">
            {s.issueId === "gpuTooLong" || s.fixes.some((f) => f.includes("critical")) ? (
              <AlertCircle className="h-5 w-5 shrink-0 text-error" />
            ) : (
              <AlertTriangle className="h-5 w-5 shrink-0 text-warning" />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-medium">{s.title}</p>
              <ul className="mt-2 space-y-1">
                {s.fixes.map((fix) => (
                  <li key={fix} className="flex items-center gap-2 text-sm">
                    <span className="text-zinc-600 dark:text-zinc-400">
                      • {fix}
                    </span>
                    {s.upgrade &&
                      fix.includes(s.upgrade.suggestedPart.name) && (
                        <button
                          type="button"
                          onClick={() =>
                            onApplyUpgrade?.(s.upgrade!.suggestedPart.id)
                          }
                          className="rounded bg-foreground px-2 py-0.5 text-xs text-background hover:opacity-90"
                        >
                          Apply
                        </button>
                      )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
