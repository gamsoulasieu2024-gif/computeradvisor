"use client";

import { Zap, AlertTriangle, CheckCircle, Info, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import {
  analyzeRgbCompatibility,
  getEcosystemColor,
  type RgbAnalysis,
  type RgbIssue,
} from "@/lib/rgb/rgb-analyzer";
import type { Build } from "@/types/build";

interface RgbSyncCheckerProps {
  build: Build;
}

export function RgbSyncChecker({ build }: RgbSyncCheckerProps) {
  const analysis: RgbAnalysis | null = analyzeRgbCompatibility(build);

  if (!analysis) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="mb-2 flex items-center gap-3">
          <Zap className="h-6 w-6 text-muted-foreground" />
          <h3 className="text-lg font-semibold text-foreground">RGB Sync Analysis</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          No RGB components detected in this build.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      {/* Header */}
      <div className="border-b border-border bg-muted/30 p-6">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="h-6 w-6 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">
              RGB Sync Analysis
            </h3>
          </div>
          {analysis.canSyncAll ? (
            <Badge variant="success">
              <CheckCircle className="mr-1 h-3 w-3" />
              Syncable
            </Badge>
          ) : (
            <Badge variant="warning">
              <AlertTriangle className="mr-1 h-3 w-3" />
              Multiple Ecosystems
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{analysis.summary}</p>
      </div>

      {/* RGB Components */}
      <div className="border-b border-border p-6">
        <h4 className="mb-4 font-semibold text-foreground">
          RGB Components ({analysis.components.length})
        </h4>
        <div className="space-y-3">
          {analysis.components.map((component) => (
            <div
              key={component.component}
              className="flex items-start gap-3 rounded-lg bg-muted/30 p-3"
            >
              <div
                className={`mt-1 h-3 w-3 rounded-full ${getEcosystemColor(
                  component.ecosystem
                )}`}
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground">
                  {component.component}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {component.voltage !== "none" && (
                    <Badge variant="outline" className="text-[10px]">
                      {component.voltage === "5v_argb" ? "5V ARGB" : "12V RGB"}
                    </Badge>
                  )}
                  <span>{component.controlledBy}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Header Usage */}
      <div className="border-b border-border p-6">
        <h4 className="mb-4 font-semibold text-foreground">
          Motherboard Header Usage
        </h4>
        <div className="space-y-4">
          <HeaderUsageRow
            label="5V ARGB Headers"
            used={analysis.headerUsage.argb5v.needed}
            available={analysis.headerUsage.argb5v.available}
          />
          <HeaderUsageRow
            label="12V RGB Headers"
            used={analysis.headerUsage.rgb12v.needed}
            available={analysis.headerUsage.rgb12v.available}
          />
        </div>
      </div>

      {/* Software Needed */}
      <div className="border-b border-border p-6">
        <h4 className="mb-4 font-semibold text-foreground">
          Software Required ({analysis.softwareNeeded.length})
        </h4>
        <div className="flex flex-wrap gap-2">
          {analysis.softwareNeeded.map((software) => (
            <Badge key={software} variant="outline">
              {software}
            </Badge>
          ))}
        </div>
        {analysis.softwareNeeded.length > 1 && (
          <p className="mt-3 text-xs text-muted-foreground">
            💡 Multiple software suites are needed to control all RGB lighting.
            You won&apos;t be able to sync every component from a single app.
          </p>
        )}
      </div>

      {/* Issues */}
      {analysis.issues.length > 0 && (
        <div className="border-b border-border p-6">
          <h4 className="mb-4 font-semibold text-foreground">
            Issues ({analysis.issues.length})
          </h4>
          <div className="space-y-3">
            {analysis.issues.map((issue) => (
              <IssueCard key={issue.title + issue.severity} issue={issue} />
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {analysis.recommendations.length > 0 && (
        <div className="bg-blue-50 p-6 dark:bg-blue-950/30">
          <div className="flex items-start gap-3">
            <ShoppingCart className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
            <div className="flex-1">
              <h4 className="mb-3 font-semibold text-blue-900 dark:text-blue-100">
                Recommended Hubs & Controllers
              </h4>
              <div className="space-y-3">
                {analysis.recommendations.map((rec) => (
                  <div
                    key={rec.name + rec.type}
                    className="rounded-lg border border-blue-200 bg-white p-3 text-sm dark:border-blue-700 dark:bg-blue-900/30"
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <div className="font-medium text-blue-900 dark:text-blue-100">
                        {rec.name}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {rec.price}
                      </Badge>
                    </div>
                    <p className="text-blue-800 dark:text-blue-200">{rec.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HeaderUsageRow({
  label,
  used,
  available,
}: {
  label: string;
  used: number;
  available: number;
}) {
  const over = used > available;
  const atLimit = used === available && available > 0;
  const ratio = available > 0 ? used / available : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm font-medium text-foreground">
          {used} / {available} used
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full transition-all ${
            over ? "bg-red-500" : atLimit ? "bg-yellow-500" : "bg-green-500"
          }`}
          style={{ width: `${Math.min(ratio * 100, 100)}%` }}
        />
      </div>
    </div>
  );
}

function IssueCard({ issue }: { issue: RgbIssue }) {
  const Icon =
    issue.severity === "critical"
      ? AlertTriangle
      : issue.severity === "warning"
        ? AlertTriangle
        : Info;

  const bgColor =
    issue.severity === "critical"
      ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
      : issue.severity === "warning"
        ? "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800"
        : "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800";

  const iconColor =
    issue.severity === "critical"
      ? "text-red-600 dark:text-red-400"
      : issue.severity === "warning"
        ? "text-yellow-600 dark:text-yellow-400"
        : "text-blue-600 dark:text-blue-400";

  return (
    <div className={`rounded-lg border p-4 ${bgColor}`}>
      <div className="flex items-start gap-3">
        <Icon className={`mt-0.5 h-5 w-5 flex-shrink-0 ${iconColor}`} />
        <div className="flex-1">
          <div className="mb-1 font-medium text-foreground">{issue.title}</div>
          <p className="mb-2 text-sm text-muted-foreground">
            {issue.description}
          </p>
          {issue.affectedComponents.length > 0 && (
            <div className="mb-2 text-xs text-muted-foreground">
              <strong>Affected:</strong> {issue.affectedComponents.join(", ")}
            </div>
          )}
          <div className="rounded bg-white/50 p-2 text-xs dark:bg-black/20">
            <strong>Solution:</strong> {issue.solution}
          </div>
        </div>
      </div>
    </div>
  );
}

