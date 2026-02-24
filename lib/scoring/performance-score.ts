/**
 * Performance scoring logic - supports target-based (resolution/refresh or creator workload) or preset-based
 */

import type { BuildInput } from "@/lib/compatibility/types";
import type { Score, ScoreBreakdownItem, BuildPreset } from "./types";
import {
  getTargetById,
  evaluateTargetFit,
} from "@/lib/presets/targets";

/** Map tier (1-10) to 0-100 score */
function tierToScore(tier: number): number {
  return ((tier - 1) / 9) * 100;
}

/** Get preset-specific CPU/GPU weights */
function getPresetWeights(preset: BuildPreset): { cpu: number; gpu: number } {
  switch (preset) {
    case "gaming-1080p":
    case "gaming-1440p":
    case "gaming-4k":
      return { cpu: 0.3, gpu: 0.7 };
    case "creator":
      return { cpu: 0.6, gpu: 0.4 };
    case "custom":
    case "budget":
    case "quiet":
    case "sff":
    default:
      return { cpu: 0.5, gpu: 0.5 };
  }
}

/**
 * Calculate performance score from build
 * When targetId is set, uses target-based scoring (meets/exceeds/below target)
 */
export function calculatePerformanceScore(
  build: BuildInput,
  preset: BuildPreset = "custom",
  targetId?: string
): Score {
  const breakdown: ScoreBreakdownItem[] = [];
  const weights = getPresetWeights(preset);
  const isGaming =
    preset === "gaming-1080p" ||
    preset === "gaming-1440p" ||
    preset === "gaming-4k";

  let cpuTier: number | null = null;
  let gpuTier: number | null = null;
  let ramGb = 0;
  let confidence = 100;

  if (build.cpu?.specs?.tier != null) {
    cpuTier = build.cpu.specs.tier;
  } else {
    confidence -= 20;
  }

  if (build.gpu?.specs?.tier != null) {
    gpuTier = build.gpu.specs.tier;
  } else {
    confidence -= 20;
  }

  if (build.ram?.specs?.capacity_gb != null) {
    ramGb = build.ram.specs.capacity_gb;
  }

  const cpuTierUsed = cpuTier ?? 5;
  const gpuTierUsed = gpuTier ?? (build.gpu ? 5 : 1);

  const target = targetId ? getTargetById(targetId) : null;

  if (target) {
    const evaluation = evaluateTargetFit(
      target,
      cpuTierUsed,
      gpuTierUsed,
      ramGb
    );

    let value = 50;
    if (evaluation.meetsTarget) {
      value = 85;
    }
    if (evaluation.cpuFit === "exceeds") value += 5;
    if (evaluation.gpuFit === "exceeds") value += 5;
    if (evaluation.ramFit === "exceeds") value += 3;
    if (evaluation.cpuFit === "below") value -= 20;
    if (evaluation.gpuFit === "below") value -= 20;
    if (evaluation.ramFit === "below") value -= 10;

    value = Math.max(0, Math.min(100, value));

    breakdown.push({
      factor: `Target: ${target.name}`,
      impact: evaluation.meetsTarget ? 35 : -20,
      explanation: evaluation.recommendation,
    });

    breakdown.push({
      factor: "CPU Fit",
      impact:
        evaluation.cpuFit === "exceeds"
          ? 5
          : evaluation.cpuFit === "below"
            ? -20
            : 0,
      explanation: `CPU is ${evaluation.cpuFit} target requirements`,
    });

    breakdown.push({
      factor: "GPU Fit",
      impact:
        evaluation.gpuFit === "exceeds"
          ? 5
          : evaluation.gpuFit === "below"
            ? -20
            : 0,
      explanation: `GPU is ${evaluation.gpuFit} target requirements`,
    });

    if (evaluation.bottleneck !== "none") {
      breakdown.push({
        factor: "Bottleneck Warning",
        impact: -5,
        explanation: `${evaluation.bottleneck.toUpperCase()} may limit performance for this target`,
      });
    }

    return {
      value,
      confidence,
      weight: 0.3,
      breakdown,
      summary: `Build ${evaluation.meetsTarget ? "meets" : "does not meet"} ${target.name} requirements`,
      targetEvaluation: evaluation,
      targetName: target.name,
    };
  }

  // Fallback: preset-based scoring
  const cpuScore = tierToScore(cpuTierUsed);
  const gpuScore = tierToScore(gpuTierUsed);

  let combinedScore = cpuScore * weights.cpu + gpuScore * weights.gpu;

  breakdown.push({
    factor: "CPU contribution",
    impact: Math.round(cpuScore * weights.cpu),
    explanation: `CPU tier ${cpuTierUsed}/10 contributes ${(weights.cpu * 100).toFixed(0)}% to performance.`,
  });

  if (build.gpu) {
    breakdown.push({
      factor: "GPU contribution",
      impact: Math.round(gpuScore * weights.gpu),
      explanation: `GPU tier ${gpuTierUsed}/10 contributes ${(weights.gpu * 100).toFixed(0)}% to performance.`,
    });
  } else {
    combinedScore = cpuScore * 0.7;
    breakdown.push({
      factor: "No dedicated GPU",
      impact: -20,
      explanation:
        "No dedicated GPU selected. Performance assumes integrated graphics.",
    });
  }

  let balanceImpact = 0;
  if (isGaming && cpuTier != null && gpuTier != null) {
    const diff = cpuTier - gpuTier;
    if (diff > 3) {
      balanceImpact = -10;
      combinedScore += balanceImpact;
      breakdown.push({
        factor: "CPU/GPU balance",
        impact: balanceImpact,
        explanation: `CPU (tier ${cpuTier}) significantly outpaces GPU (tier ${gpuTier}). Consider a stronger GPU for gaming.`,
      });
    } else if (Math.abs(diff) <= 1) {
      balanceImpact = 5;
      combinedScore = Math.min(100, combinedScore + balanceImpact);
      breakdown.push({
        factor: "Balanced build",
        impact: balanceImpact,
        explanation: "CPU and GPU are well-matched for your use case.",
      });
    }
  }

  const value = Math.max(0, Math.min(100, Math.round(combinedScore)));

  let summary: string;
  if (build.gpu) {
    const strength =
      (gpuTierUsed >= cpuTierUsed ? "GPU" : "CPU") + " is the strength";
    const bottleneckText =
      isGaming && (cpuTier ?? 0) - (gpuTier ?? 0) > 3
        ? " Consider upgrading the GPU for better gaming performance."
        : "";
    summary = `Performance score is ${value}, suitable for ${preset}. ${strength}.${bottleneckText}`;
  } else {
    summary = `Performance score is ${value}. No dedicated GPU; suitable for light workloads.`;
  }

  return {
    value,
    confidence,
    weight: 0.3,
    breakdown,
    summary,
  };
}
