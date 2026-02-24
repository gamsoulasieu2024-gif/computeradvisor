/**
 * Main scoring orchestrator – 4-score system (Compatibility, Performance, Value, Usability)
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
  targetId?: string;
}

/**
 * Calculate all 4 scores and overall result.
 * Overall = weighted average (compat 40%, performance 30%, value 15%, usability 15%).
 * If compatibility &lt; 50, overall = compatibility * 0.5.
 *
 * @param build - Build input (selected parts)
 * @param compatResult - Result from checkCompatibility(build)
 * @param options - Optional preset for performance/value weighting (gaming vs creator vs custom)
 */
export function calculateScores(
  build: BuildInput,
  compatResult: CompatibilityResult,
  options?: CalculateScoresOptions
): ScoreResult {
  const preset = options?.preset ?? "custom";
  const targetId = options?.targetId;

  const compatibility = calculateCompatibilityScore(compatResult);
  const performance = calculatePerformanceScore(build, preset, targetId);
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
