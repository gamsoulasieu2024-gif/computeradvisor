/**
 * Compatibility scoring logic
 */

import type { CompatibilityResult, Issue } from "@/lib/compatibility/types";
import type { Score, ScoreBreakdownItem } from "./types";

const WARNING_PENALTY: Record<string, number> = {
  critical: -25,
  warning: -15,
  info: -5,
};

/**
 * Calculate compatibility score from compatibility result
 */
export function calculateCompatibilityScore(
  compatResult: CompatibilityResult
): Score {
  const breakdown: ScoreBreakdownItem[] = [];
  let score = 100;

  // Hard fails → score = 0
  if (compatResult.hardFails.length > 0) {
    score = 0;
    for (const issue of compatResult.hardFails) {
      breakdown.push({
        factor: issue.title,
        impact: -100,
        explanation: issue.description,
      });
    }
    return {
      value: 0,
      confidence: compatResult.confidence,
      weight: 0.4,
      breakdown,
      summary: `Build has ${compatResult.hardFails.length} critical compatibility issue(s). Fix these before proceeding.`,
    };
  }

  // Warnings: -5 to -25 based on severity
  for (const issue of compatResult.warnings) {
    const penalty = WARNING_PENALTY[issue.severity] ?? -10;
    score += penalty;
    breakdown.push({
      factor: issue.title,
      impact: penalty,
      explanation: issue.description,
    });
  }

  // Notes: mild penalty
  for (const issue of compatResult.notes) {
    const penalty = -5;
    score += penalty;
    breakdown.push({
      factor: issue.title,
      impact: penalty,
      explanation: issue.description,
    });
  }

  const value = Math.max(0, Math.min(100, Math.round(score)));

  let summary: string;
  if (compatResult.warnings.length > 0 || compatResult.notes.length > 0) {
    const top = [...compatResult.warnings, ...compatResult.notes]
      .slice(0, 2)
      .map((i) => i.title)
      .join(", ");
    summary = `Your compatibility score is ${value} because: ${top}. See breakdown for details.`;
  } else {
    summary = `Your compatibility score is ${value}. No compatibility issues detected.`;
  }

  return {
    value,
    confidence: compatResult.confidence,
    weight: 0.4,
    breakdown,
    summary,
  };
}
