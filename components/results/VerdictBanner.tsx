"use client";

import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConfidenceIndicator } from "./ConfidenceIndicator";

export type VerdictType = "compatible" | "warnings" | "incompatible";

interface VerdictBannerProps {
  verdict: VerdictType;
  issueCount: number;
  confidence: number;
  /** Number of compatibility checks performed (optional, for display) */
  checksCount?: number;
}

export function VerdictBanner({
  verdict,
  issueCount,
  confidence,
  checksCount,
}: VerdictBannerProps) {
  const config = {
    compatible: {
      icon: CheckCircle,
      label: "Compatible",
      sublabel: "Your build is ready",
      className: "border-success/50 bg-success/10 text-success",
      iconClassName: "text-success",
    },
    warnings: {
      icon: AlertTriangle,
      label: "Compatible with Warnings",
      sublabel: "Fix warnings for best experience",
      className: "border-warning/50 bg-warning/10 text-warning",
      iconClassName: "text-warning",
    },
    incompatible: {
      icon: XCircle,
      label: "Not Compatible",
      sublabel: "Fix critical issues before building",
      className: "border-error/50 bg-error/10 text-error",
      iconClassName: "text-error",
    },
  };

  const c = config[verdict];
  const Icon = c.icon;

  return (
    <div
      className={cn(
        "flex items-center gap-6 rounded-2xl border-2 p-6 sm:p-8",
        c.className
      )}
    >
      <div className="shrink-0">
        <Icon className={cn("h-16 w-16 sm:h-20 sm:w-20", c.iconClassName)} />
      </div>
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-bold sm:text-3xl">{c.label}</h1>
        <p className="mt-1 text-sm opacity-90">{c.sublabel}</p>
        <p className="mt-2 text-sm">
          {issueCount > 0
            ? `${issueCount} issue${issueCount === 1 ? "" : "s"} found`
            : "No issues detected"}
        </p>
        <div className="flex flex-wrap items-center gap-4 mt-3">
          <ConfidenceIndicator confidence={confidence} size="lg" />
          {checksCount != null && (
            <span className="text-sm text-muted-foreground">
              Based on {checksCount} compatibility check
              {checksCount === 1 ? "" : "s"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
