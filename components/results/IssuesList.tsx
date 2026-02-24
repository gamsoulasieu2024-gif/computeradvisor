"use client";

import { useState } from "react";
import { AlertCircle, AlertTriangle, Info, ChevronDown, ChevronUp, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Issue } from "@/lib/compatibility/types";
import { IssueEvidence } from "./IssueEvidence";

interface IssuesListProps {
  hardFails: Issue[];
  warnings: Issue[];
  notes: Issue[];
}

function IssueCard({
  issue,
  expandedId,
  onToggle,
}: {
  issue: Issue & { severity?: "critical" | "warning" | "info" };
  expandedId: string | null;
  onToggle: (id: string) => void;
}) {
  const Icon =
    issue.severity === "critical"
      ? () => <AlertCircle className="h-5 w-5 shrink-0 text-error" />
      : issue.severity === "warning"
        ? () => <AlertTriangle className="h-5 w-5 shrink-0 text-warning" />
        : () => <Info className="h-5 w-5 shrink-0 text-zinc-500" />;
  return (
    <div
      className={cn(
        "relative rounded-xl border p-4",
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
        onClick={() => onToggle(issue.id)}
        className="flex w-full items-start gap-3 text-left"
      >
        <Icon />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-foreground">{issue.title}</p>
          <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">
            {issue.description}
          </p>
          {issue.affectedParts?.length > 0 && (
            <p className="mt-2 text-xs text-zinc-500">
              Affected:{" "}
              {issue.affectedParts.map((partId, i) => (
                <span key={partId}>
                  {i > 0 && ", "}
                  <a
                    href={`#part-${partId}`}
                    className="text-foreground underline hover:no-underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {partId}
                  </a>
                </span>
              ))}
            </p>
          )}
        </div>
        {issue.suggestedFixes?.length ? (
          <span className="shrink-0 text-zinc-400">
            {expandedId === issue.id ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </span>
        ) : null}
      </button>
      {issue.evidence && (
        <div className="mt-2 pl-8">
          <IssueEvidence evidence={issue.evidence} />
        </div>
      )}
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
  );
}

export function IssuesList({
  hardFails,
  warnings,
  notes,
}: IssuesListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const criticalIssues = hardFails.map((i) => ({ ...i, severity: "critical" as const }));
  const nonEfficiencyWarnings = warnings
    .filter((i) => i.category !== "efficiency")
    .map((i) => ({ ...i, severity: "warning" as const }));
  const efficiencyTips = [
    ...warnings.filter((i) => i.category === "efficiency"),
    ...notes.filter((i) => i.category === "efficiency"),
  ].map((i) => ({ ...i, severity: (i.severity as "warning" | "info") || "info" }));
  const nonEfficiencyNotes = notes
    .filter((i) => i.category !== "efficiency")
    .map((i) => ({ ...i, severity: "info" as const }));

  const all = [...criticalIssues, ...nonEfficiencyWarnings, ...nonEfficiencyNotes];

  if (all.length === 0 && efficiencyTips.length === 0) {
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
    <div className="space-y-6">
      {all.length > 0 && (
        <div className="space-y-3">
          {all.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              expandedId={expandedId}
              onToggle={(id) =>
                setExpandedId(expandedId === id ? null : id)
              }
            />
          ))}
        </div>
      )}
      {efficiencyTips.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-foreground">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            Efficiency & Value Tips
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
            These aren&apos;t errors, but suggestions to optimize your budget and
            avoid overspending on features you may not need.
          </p>
          <div className="space-y-3">
            {efficiencyTips.map((issue) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                expandedId={expandedId}
                onToggle={(id) =>
                  setExpandedId(expandedId === id ? null : id)
                }
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
