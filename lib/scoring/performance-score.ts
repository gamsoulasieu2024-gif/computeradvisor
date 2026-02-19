/**
 * Performance scoring logic
 */

import type { BuildInput } from "@/lib/compatibility/types";
import type { Score, ScoreBreakdownItem, BuildPreset } from "./types";

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
 */
export function calculatePerformanceScore(
  build: BuildInput,
  preset: BuildPreset = "custom"
): Score {
  const breakdown: ScoreBreakdownItem[] = [];
  const weights = getPresetWeights(preset);
  const isGaming =
    preset === "gaming-1080p" ||
    preset === "gaming-1440p" ||
    preset === "gaming-4k";

  let cpuTier: number | null = null;
  let gpuTier: number | null = null;
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

  // Default tiers if missing (reduce confidence)
  const cpuTierUsed = cpuTier ?? 5;
  const gpuTierUsed = gpuTier ?? (build.gpu ? 5 : 1);

  const cpuScore = tierToScore(cpuTierUsed);
  const gpuScore = tierToScore(gpuTierUsed);

  let combinedScore =
    cpuScore * weights.cpu + gpuScore * weights.gpu;

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
    combinedScore = cpuScore * 0.7; // No GPU: weight CPU more
    breakdown.push({
      factor: "No dedicated GPU",
      impact: -20,
      explanation: "No dedicated GPU selected. Performance assumes integrated graphics.",
    });
  }

  // Bottleneck penalty: CPU tier - GPU tier > 3 for gaming
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
    const strength = (gpuTierUsed >= cpuTierUsed ? "GPU" : "CPU") + " is the strength";
    const bottleneck =
      isGaming && (cpuTier ?? 0) - (gpuTier ?? 0) > 3
        ? " Consider upgrading the GPU for better gaming performance."
        : "";
    summary = `Performance score is ${value}, suitable for ${preset}. ${strength}.${bottleneck}`;
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
