"use client";

import type { IssueEvidence as EvidenceType } from "@/lib/compatibility/types";

interface IssueEvidenceProps {
  evidence: EvidenceType;
}

export function IssueEvidence({ evidence }: IssueEvidenceProps) {
  if (!evidence?.values || Object.keys(evidence.values).length === 0) return null;

  return (
    <div className="mt-3 rounded-md bg-muted/50 p-3 space-y-2 text-sm">
      <div className="font-medium text-foreground">Evidence:</div>

      {evidence.comparison && (
        <div className="font-mono text-xs bg-background px-2 py-1 rounded border border-border">
          {evidence.comparison}
        </div>
      )}

      <div className="space-y-1">
        {Object.entries(evidence.values).map(([key, value]) => (
          <div
            key={key}
            className="flex justify-between gap-4 text-muted-foreground"
          >
            <span>{key}:</span>
            <span className="font-medium text-foreground shrink-0">{String(value)}</span>
          </div>
        ))}
      </div>

      {evidence.calculation && (
        <div className="text-xs text-muted-foreground italic border-t border-border pt-2 mt-2">
          {evidence.calculation}
        </div>
      )}
    </div>
  );
}
