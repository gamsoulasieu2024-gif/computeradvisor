"use client";

import { useMemo } from "react";
import { useBuild } from "@/hooks/use-build";
import { checkCompatibility } from "@/lib/compatibility";
import { estimateLoad, getHeadroom } from "@/lib/compatibility/power";
import { cn } from "@/lib/utils";
import { AlertCircle, AlertTriangle, CheckCircle, Zap } from "lucide-react";

function SeverityIcon({ severity }: { severity: string }) {
  if (severity === "critical")
    return <AlertCircle className="h-4 w-4 text-error shrink-0" />;
  if (severity === "warning")
    return <AlertTriangle className="h-4 w-4 text-warning shrink-0" />;
  return <CheckCircle className="h-4 w-4 text-success shrink-0" />;
}

export function LiveStatus() {
  const { selectedParts } = useBuild();

  const compatResult = useMemo(() => {
    const build = {
      cpu: selectedParts.cpu,
      gpu: selectedParts.gpu,
      motherboard: selectedParts.motherboard,
      ram: selectedParts.ram,
      storage: selectedParts.storage ?? [],
      psu: selectedParts.psu,
      cooler: selectedParts.cooler,
      case: selectedParts.case,
    };
    return checkCompatibility(build);
  }, [selectedParts]);

  const load = useMemo(() => {
    return estimateLoad({
      cpu: selectedParts.cpu,
      gpu: selectedParts.gpu,
      ram: selectedParts.ram,
      storage: selectedParts.storage ?? [],
    });
  }, [selectedParts]);

  const headroom = useMemo(
    () =>
      selectedParts.psu
        ? getHeadroom(selectedParts.psu.specs.wattage_w, load)
        : 0,
    [selectedParts.psu, load]
  );

  const topIssues = useMemo(() => {
    const all = [
      ...compatResult.hardFails.map((i) => ({ ...i, severity: "critical" as const })),
      ...compatResult.warnings.map((i) => ({ ...i, severity: "warning" as const })),
      ...compatResult.notes.slice(0, 2).map((i) => ({ ...i, severity: "info" as const })),
    ];
    return all.slice(0, 3);
  }, [compatResult]);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-foreground">Live Status</h3>

      {/* Compatibility */}
      <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="flex items-center gap-2">
          {compatResult.isCompatible ? (
            <CheckCircle className="h-5 w-5 text-success" />
          ) : (
            <AlertCircle className="h-5 w-5 text-error" />
          )}
          <span className="text-sm font-medium">
            {compatResult.isCompatible ? "Compatible" : "Issues Found"}
          </span>
        </div>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Confidence: {compatResult.confidence}%
        </p>
      </div>

      {/* Top Issues */}
      {topIssues.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Top Issues
          </h4>
          <ul className="space-y-2">
            {topIssues.map((issue, i) => (
              <li
                key={issue.id + i}
                className="flex gap-2 rounded border border-zinc-200 bg-white p-2 text-xs dark:border-zinc-800 dark:bg-zinc-900/50"
              >
                <SeverityIcon severity={issue.severity} />
                <span className="line-clamp-2 text-zinc-700 dark:text-zinc-300">
                  {issue.title}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Power */}
      {selectedParts.psu && load > 0 && (
        <div className="space-y-2">
          <h4 className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">
            <Zap className="h-4 w-4" />
            Power Draw
          </h4>
          <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900/50">
            <div className="flex justify-between text-sm">
              <span>{load}W estimated</span>
              <span>{selectedParts.psu.specs.wattage_w}W PSU</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  headroom >= 1.25
                    ? "bg-success"
                    : headroom >= 1.05
                      ? "bg-warning"
                      : "bg-error"
                )}
                style={{
                  width: `${Math.min(100, (load / selectedParts.psu.specs.wattage_w) * 100)}%`,
                }}
              />
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              {headroom >= 1.25
                ? "Good headroom"
                : headroom >= 1.05
                  ? "Marginal headroom"
                  : "Insufficient headroom"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
