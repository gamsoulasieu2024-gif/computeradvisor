"use client";

import { useState } from "react";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Issue } from "@/lib/compatibility/types";

interface IssuesListProps {
  hardFails: Issue[];
  warnings: Issue[];
  notes: Issue[];
}

export function IssuesList({
  hardFails,
  warnings,
  notes,
}: IssuesListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const all = [
    ...hardFails.map((i) => ({ ...i, severity: "critical" as const })),
    ...warnings.map((i) => ({ ...i, severity: "warning" as const })),
    ...notes.map((i) => ({ ...i, severity: "info" as const })),
  ];

  if (all.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
        <p className="text-zinc-500">No issues detected.</p>
      </div>
    );
  }

  const Icon = ({ severity }: { severity: string }) => {
    if (severity === "critical")
      return <AlertCircle className="h-5 w-5 shrink-0 text-error" />;
    if (severity === "warning")
      return <AlertTriangle className="h-5 w-5 shrink-0 text-warning" />;
    return <Info className="h-5 w-5 shrink-0 text-zinc-500" />;
  };

  return (
    <div className="space-y-3">
      {all.map((issue) => (
        <div
          key={issue.id}
          className={cn(
            "rounded-xl border p-4",
            issue.severity === "critical" &&
              "border-error/50 bg-error/5 dark:bg-error/10",
            issue.severity === "warning" &&
              "border-warning/50 bg-warning/5 dark:bg-warning/10",
            issue.severity === "info" &&
              "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/50"
          )}
        >
          <button
            type="button"
            onClick={() =>
              setExpandedId(expandedId === issue.id ? null : issue.id)
            }
            className="flex w-full items-start gap-3 text-left"
          >
            <Icon severity={issue.severity} />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-foreground">{issue.title}</p>
              <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">
                {issue.description}
              </p>
              {issue.affectedParts?.length > 0 && (
                <p className="mt-2 text-xs text-zinc-500">
                  Affected: {issue.affectedParts.join(", ")}
                </p>
              )}
            </div>
          </button>
          {expandedId === issue.id && issue.suggestedFixes?.length && (
            <div className="mt-3 border-t border-zinc-200 pt-3 dark:border-zinc-700">
              <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                How to fix:
              </p>
              <ul className="mt-1 list-disc space-y-0.5 pl-4 text-sm">
                {issue.suggestedFixes.map((fix) => (
                  <li key={fix}>{fix}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
