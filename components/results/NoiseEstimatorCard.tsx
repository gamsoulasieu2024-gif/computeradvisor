"use client";

import { Volume2, VolumeX, Volume1 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import {
  estimateNoise,
  getNoiseColor,
  type NoiseEstimate,
  type NoiseAnalysis,
} from "@/lib/performance/noise-estimator";
import type { Build } from "@/types/build";

interface NoiseEstimatorCardProps {
  build: Build;
}

export function NoiseEstimatorCard({ build }: NoiseEstimatorCardProps) {
  const analysis: NoiseAnalysis = estimateNoise(build);

  const getVolumeIcon = (level: string) => {
    if (level === "silent" || level === "quiet") return VolumeX;
    if (level === "moderate") return Volume1;
    return Volume2;
  };

  const renderNoiseEstimate = (
    label: string,
    estimate: NoiseEstimate,
    description: string
  ) => {
    const Icon = getVolumeIcon(estimate.level);

    return (
      <div className="border border-border rounded-lg p-4 bg-card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${getNoiseColor(estimate.level)}`} />
            <span className="font-medium text-foreground">{label}</span>
          </div>
          <Badge
            variant={
              estimate.confidence === "high"
                ? "success"
                : estimate.confidence === "medium"
                  ? "warning"
                  : "outline"
            }
            className="text-xs"
          >
            {estimate.confidence} confidence
          </Badge>
        </div>

        <div className="mb-3">
          <div className={`text-3xl font-bold ${getNoiseColor(estimate.level)}`}>
            {estimate.minDb}-{estimate.maxDb} dB
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            Likely: ~{estimate.likelyDb} dB
          </div>
        </div>

        <div className="text-xs text-muted-foreground mb-2">{description}</div>

        <div className="text-xs italic text-muted-foreground">
          {estimate.comparison}
        </div>
      </div>
    );
  };

  return (
    <div className="border border-border rounded-lg bg-card overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-border bg-muted/30">
        <div className="flex items-center gap-3 mb-2">
          <Volume2 className="h-6 w-6 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">
            Noise Level Estimate
          </h3>
          <InfoTooltip
            title="How We Estimate Noise"
            content={
              <div className="space-y-2 text-sm">
                <p>Noise estimates are based on:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>CPU and GPU TDP and cooler headroom</li>
                  <li>Cooler type (air vs AIO) and fan count</li>
                  <li>Case airflow, mesh vs dampened panels, and fan count</li>
                  <li>PSU load percentage relative to wattage</li>
                </ul>
                <p className="mt-2 italic">
                  <strong>Note:</strong> These are honest ranges, not precise
                  measurements. Actual noise varies with fan curves, ambient
                  temperature, and specific models.
                </p>
              </div>
            }
            size="md"
          />
        </div>
        <p className="text-sm text-muted-foreground">{analysis.summary}</p>
      </div>

      {/* Noise Estimates */}
      <div className="p-6 border-b border-border">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {renderNoiseEstimate(
            "Idle",
            analysis.idle,
            "Desktop idle, light browsing"
          )}
          {renderNoiseEstimate(
            "Normal Use",
            analysis.normal,
            "Gaming, video editing, typical workloads"
          )}
          {renderNoiseEstimate(
            "Full Load",
            analysis.load,
            "CPU + GPU stress test, heavy rendering"
          )}
        </div>

        {/* Visual Noise Scale */}
        <div className="mt-6">
          <div className="text-sm font-medium text-foreground mb-2">
            Noise Reference Scale
          </div>
          <div className="relative h-12 rounded-lg overflow-hidden bg-gradient-to-r from-green-100 via-yellow-100 via-orange-100 to-red-100 dark:from-green-950/30 dark:via-yellow-950/30 dark:via-orange-950/30 dark:to-red-950/30">
            {/* Markers */}
            <div className="absolute inset-0 flex items-center justify-between px-2 text-xs font-medium">
              <span className="text-green-700 dark:text-green-400">20 dB</span>
              <span className="text-yellow-700 dark:text-yellow-400">35 dB</span>
              <span className="text-orange-700 dark:text-orange-400">45 dB</span>
              <span className="text-red-700 dark:text-red-400">60 dB</span>
            </div>

            {/* Normal range indicator */}
            <div
              className="absolute top-0 bottom-0 bg-primary/30 border-l-2 border-r-2 border-primary"
              style={{
                left: `${Math.max(
                  0,
                  ((analysis.normal.minDb - 20) / 40) * 100
                )}%`,
                width: `${Math.max(
                  5,
                  ((analysis.normal.maxDb - analysis.normal.minDb) / 40) * 100
                )}%`,
              }}
            />
          </div>
          <div className="mt-1 flex justify-between text-xs text-muted-foreground">
            <span>Whisper</span>
            <span>Quiet room</span>
            <span>Normal conversation</span>
            <span>Vacuum</span>
          </div>
        </div>
      </div>

      {/* Noise Contributors */}
      {analysis.contributors.length > 0 && (
        <div className="p-6 border-b border-border">
          <h4 className="mb-4 font-semibold text-foreground">Main Noise Sources</h4>
          <div className="space-y-3">
            {analysis.contributors.map((contributor, i) => (
              <div key={i} className="flex items-start gap-3">
                <Badge
                  variant={
                    contributor.contribution === "high"
                      ? "error"
                      : contributor.contribution === "medium"
                        ? "warning"
                        : "success"
                  }
                  className="mt-0.5 text-xs"
                >
                  {contributor.contribution}
                </Badge>
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">
                    {contributor.component}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {contributor.reason}
                  </div>
                  <div className="mt-1 text-xs italic text-muted-foreground">
                    {contributor.dbRange}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {analysis.recommendations.length > 0 && (
        <div className="p-6 bg-blue-50 dark:bg-blue-950/30">
          <h4 className="mb-3 font-semibold text-foreground">
            Quieting Recommendations
          </h4>
          <ul className="space-y-2">
            {analysis.recommendations.map((rec, i) => (
              <li key={i} className="text-sm text-muted-foreground">
                • {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

