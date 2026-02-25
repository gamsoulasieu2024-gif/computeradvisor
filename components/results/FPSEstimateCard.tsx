"use client";

import { Badge } from "@/components/ui/Badge";
import { AlertTriangle, Info } from "lucide-react";
import type { FPSEstimate } from "@/lib/performance/fps-estimation";

interface FPSEstimateCardProps {
  estimate: FPSEstimate;
  targetName: string;
}

export function FPSEstimateCard({ estimate, targetName }: FPSEstimateCardProps) {
  const badgeVariant =
    estimate.confidence === "high"
      ? "success"
      : estimate.confidence === "medium"
        ? "warning"
        : "error";

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="mb-1 text-lg font-semibold text-foreground">
            Expected Performance
          </h3>
          <p className="text-sm text-muted-foreground">{targetName} gaming</p>
        </div>
        <Badge variant={badgeVariant}>
          {estimate.confidence} confidence
        </Badge>
      </div>

      <div className="mb-6">
        <div className="mb-2 flex items-baseline gap-3">
          <div className="text-5xl font-bold text-foreground">
            {estimate.likely}
          </div>
          <div className="text-xl text-muted-foreground">FPS</div>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            Range: {estimate.min} – {estimate.max} FPS
          </span>
          <span>•</span>
          <span className="font-medium text-foreground">
            {estimate.settingsQuality} settings
          </span>
        </div>

        <div className="mt-4">
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{
                width: `${Math.min((estimate.likely / 200) * 100, 100)}%`,
              }}
            />
          </div>
          <div className="mt-1 flex justify-between text-xs text-muted-foreground">
            <span>0</span>
            <span>60</span>
            <span>144</span>
            <span>240</span>
          </div>
        </div>
      </div>

      <div className="mb-4 space-y-3">
        <div className="flex items-start gap-2 rounded-md border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-950/30">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
          <div className="flex-1 text-sm">
            <p className="mb-1 font-medium text-yellow-900 dark:text-yellow-100">
              Conservative Estimate
            </p>
            <p className="text-xs text-yellow-800 dark:text-yellow-200">
              These are rough estimates for demanding AAA games. Actual
              performance varies significantly by game, driver version, and
              specific settings.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Info className="h-4 w-4" />
          <span>Important Notes:</span>
        </div>
        <ul className="space-y-1.5">
          {estimate.caveats.map((caveat, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-xs text-muted-foreground"
            >
              <span className="mt-0.5 text-primary">•</span>
              <span className="flex-1">{caveat}</span>
            </li>
          ))}
        </ul>
      </div>

      <details className="mt-4 border-t border-border pt-4 text-xs text-muted-foreground">
        <summary className="cursor-pointer transition-colors hover:text-foreground">
          How we calculate this
        </summary>
        <div className="mt-2 space-y-1 pl-4">
          <p>• Based on component tier rankings (1–10 scale)</p>
          <p>• Considers resolution and target refresh rate</p>
          <p>• Accounts for CPU bottlenecks at lower resolutions</p>
          <p>• Conservative estimates for AAA games without upscaling</p>
          <p>• NOT based on real benchmark data (we don&apos;t have access to that)</p>
        </div>
      </details>
    </div>
  );
}
