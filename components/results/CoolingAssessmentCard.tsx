"use client";

import {
  Thermometer,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { assessCooling } from "@/lib/compatibility/cooling-adequacy";
import type { CPU, Cooler } from "@/types/components";

interface CoolingAssessmentCardProps {
  cpu: CPU;
  cooler: Cooler;
}

export function CoolingAssessmentCard({ cpu, cooler }: CoolingAssessmentCardProps) {
  const assessment = assessCooling(cpu, cooler);

  if (!assessment) return null;

  const cpuTDP = cpu.specs.tdp_w ?? 0;
  const coolerRating = cooler.specs.tdp_rating_w ?? 0;
  if (cpuTDP === 0 || coolerRating === 0) return null;

  const ratingConfig = {
    excellent: {
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-950/30",
      borderColor: "border-green-200 dark:border-green-800",
      icon: CheckCircle,
      label: "Excellent",
      badge: "success" as const,
    },
    good: {
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-950/30",
      borderColor: "border-green-200 dark:border-green-800",
      icon: CheckCircle,
      label: "Good",
      badge: "success" as const,
    },
    adequate: {
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
      borderColor: "border-blue-200 dark:border-blue-800",
      icon: TrendingUp,
      label: "Adequate",
      badge: "outline" as const,
    },
    marginal: {
      color: "text-yellow-500",
      bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
      borderColor: "border-yellow-200 dark:border-yellow-800",
      icon: AlertTriangle,
      label: "Marginal",
      badge: "warning" as const,
    },
    insufficient: {
      color: "text-red-500",
      bgColor: "bg-red-50 dark:bg-red-950/30",
      borderColor: "border-red-200 dark:border-red-800",
      icon: AlertTriangle,
      label: "Insufficient",
      badge: "error" as const,
    },
  }[assessment.rating];

  const Icon = ratingConfig.icon;

  // Baseline: CPU TDP as share of cooler capacity (cap at 100% for bar width)
  const baselinePercent = Math.min(
    100,
    coolerRating > 0 ? (cpuTDP / coolerRating) * 100 : 0
  );

  return (
    <div
      className={`rounded-lg border p-6 ${ratingConfig.bgColor} ${ratingConfig.borderColor}`}
    >
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Thermometer className={`h-6 w-6 ${ratingConfig.color}`} />
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Cooling Assessment
            </h3>
            <p className="text-sm text-muted-foreground">
              {cooler.name} for {cpu.name}
            </p>
          </div>
        </div>
        <Badge variant={ratingConfig.badge}>{ratingConfig.label}</Badge>
      </div>

      {/* Visual Headroom Bar */}
      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Cooling Headroom
          </span>
          <span className="text-sm font-medium text-foreground">
            {assessment.headroom >= 0
              ? `${assessment.headroom.toFixed(0)}%`
              : `Over by ${Math.abs(assessment.headroom).toFixed(0)}%`}
          </span>
        </div>

        <div className="relative flex h-3 overflow-hidden rounded-full bg-muted">
          {/* CPU TDP “used” portion + dashed boundary */}
          {assessment.headroom >= 0 ? (
            <>
              <div
                className="h-full border-r-2 border-dashed border-foreground/30 bg-primary/20"
                style={{ width: `${baselinePercent}%` }}
              />
              <div
                className={`h-full transition-all ${
                  assessment.headroom >= 25
                    ? "bg-green-500"
                    : assessment.headroom >= 10
                      ? "bg-yellow-500"
                      : "bg-orange-500"
                }`}
                style={{ width: `${100 - baselinePercent}%` }}
              />
            </>
          ) : (
            <div className="h-full w-full bg-red-500" />
          )}
        </div>

        <div className="mt-1 flex justify-between text-xs text-muted-foreground">
          <span>CPU TDP: {cpuTDP}W</span>
          <span>Cooler: {coolerRating}W</span>
        </div>
      </div>

      {/* Recommendation */}
      <div className="flex items-start gap-2">
        <Icon
          className={`mt-0.5 h-5 w-5 flex-shrink-0 ${ratingConfig.color}`}
        />
        <p className="text-sm text-foreground">{assessment.recommendation}</p>
      </div>

      {/* Additional Context */}
      {assessment.rating === "excellent" && (
        <div className="mt-3 text-xs text-muted-foreground">
          Great choice! This cooler can handle sustained loads and has room for
          overclocking.
        </div>
      )}
      {assessment.rating === "marginal" && (
        <div className="mt-3 text-xs text-foreground">
          Consider upgrading cooler if you plan to run CPU-heavy workloads for
          extended periods.
        </div>
      )}
      {assessment.rating === "insufficient" && (
        <div className="mt-3 text-xs font-medium text-red-600 dark:text-red-400">
          This configuration will cause thermal throttling and performance loss!
        </div>
      )}
    </div>
  );
}
