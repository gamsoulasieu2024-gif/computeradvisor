/**
 * Score explanation generator
 */

import type { ScoreResult } from "./types";

/**
 * Generate user-facing explanations for each score
 */
export function generateExplanations(result: ScoreResult): Record<string, string> {
  const { scores } = result;

  const compatibility = scores.compatibility;
  const compExpl =
    compatibility.value === 0
      ? `Your compatibility score is 0 because there are critical issues that must be fixed. ${compatibility.breakdown[0]?.explanation ?? ""}`
      : `Your compatibility score is ${compatibility.value} (confidence: ${compatibility.confidence}%). ${
          compatibility.breakdown.length > 0
            ? `Top concerns: ${compatibility.breakdown.slice(0, 2).map((b) => b.factor).join(", ")}.`
            : "No compatibility issues detected."
        }`;

  const performance = scores.performance;
  const perfExpl = `${performance.summary} Confidence: ${performance.confidence}%. ${
    performance.breakdown.length > 0
      ? `See breakdown for CPU/GPU contributions.`
      : ""
  }`.trim();

  const value = scores.value;
  const valueExpl = `${value.summary} Confidence: ${value.confidence}%. ${
    value.breakdown.length > 0 ? `Balance and price/performance details in breakdown.` : ""
  }`.trim();

  const usability = scores.usability;
  const usabExpl = `${usability.summary} Confidence: ${usability.confidence}%. ${
    usability.breakdown.length > 0 ? `Headroom and upgrade potential in breakdown.` : ""
  }`.trim();

  return {
    compatibility: compExpl,
    performance: perfExpl,
    value: valueExpl,
    usability: usabExpl,
  };
}
