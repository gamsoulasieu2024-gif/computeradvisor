/**
 * Main scoring orchestrator
 */

import type { BuildInput } from "@/lib/compatibility/types";
import type { CompatibilityResult } from "@/lib/compatibility/types";
import type { ScoreResult, BuildPreset } from "./types";
import { calculateCompatibilityScore } from "./compatibility-score";
import { calculatePerformanceScore } from "./performance-score";
import { calculateValueScore } from "./value-score";
import { calculateUsabilityScore } from "./usability-score";

const COMPAT_WEIGHT = 0.4;
const PERF_WEIGHT = 0.3;
const VALUE_WEIGHT = 0.15;
const USAB_WEIGHT = 0.15;

export interface CalculateScoresOptions {
  preset?: BuildPreset;
}

/**
 * Calculate all 4 scores and overall result
 */
export function calculateScores(
  build: BuildInput,
  compatResult: CompatibilityResult,
  options?: CalculateScoresOptions
): ScoreResult {
  const preset = options?.preset ?? "custom";

  const compatibility = calculateCompatibilityScore(compatResult);
  const performance = calculatePerformanceScore(build, preset);
  const value = calculateValueScore(build, preset);
  const usability = calculateUsabilityScore(build);

  // Overall: weighted average
  // But if compatibility < 50, overall = compatibility * 0.5
  let overall: number;
  if (compatibility.value < 50) {
    overall = compatibility.value * 0.5;
  } else {
    overall =
      compatibility.value * COMPAT_WEIGHT +
      performance.value * PERF_WEIGHT +
      value.value * VALUE_WEIGHT +
      usability.value * USAB_WEIGHT;
  }

  overall = Math.max(0, Math.min(100, Math.round(overall)));

  return {
    overall,
    scores: {
      compatibility,
      performance,
      value,
      usability,
    },
  };
}
