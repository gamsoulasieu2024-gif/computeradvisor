/**
 * Score explanation generator – 2–3 sentence summaries with link to breakdown
 */

import type { ScoreResult } from "./types";

/**
 * Generate user-facing explanations for each score. Each explanation is 2–3 sentences
 * and points to the breakdown for details.
 */
export function generateExplanations(result: ScoreResult): Record<string, string> {
  const { scores } = result;

  const compatibility = scores.compatibility;
  const compExpl =
    compatibility.value === 0
      ? `Your compatibility score is 0 because there are critical issues that must be fixed. ${compatibility.breakdown[0]?.explanation ?? ""} See breakdown for details.`
      : `Your compatibility score is ${compatibility.value} because ${compatibility.breakdown.length > 0 ? `the main factors are: ${compatibility.breakdown.slice(0, 2).map((b) => b.factor).join(" and ")}.` : "no compatibility issues were detected."} Confidence: ${compatibility.confidence}%. See breakdown for details.`;

  const performance = scores.performance;
  const perfExpl = `${performance.summary} Confidence: ${performance.confidence}%. See breakdown for CPU/GPU contributions and balance.`;

  const value = scores.value;
  const valueExpl = `${value.summary} Confidence: ${value.confidence}%. See breakdown for balance and price/performance.`;

  const usability = scores.usability;
  const usabExpl = `${usability.summary} Confidence: ${usability.confidence}%. See breakdown for headroom and upgrade potential.`;

  return {
    compatibility: compExpl,
    performance: perfExpl,
    value: valueExpl,
    usability: usabExpl,
  };
}
