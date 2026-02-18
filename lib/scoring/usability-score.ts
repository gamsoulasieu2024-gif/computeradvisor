/**
 * Usability scoring logic
 */

import type { BuildInput } from "@/lib/compatibility/types";
import { estimateLoad, getHeadroom } from "@/lib/compatibility/power";
import type { Score, ScoreBreakdownItem } from "./types";

/**
 * Calculate usability score from build
 */
export function calculateUsabilityScore(build: BuildInput): Score {
  const breakdown: ScoreBreakdownItem[] = [];
  let score = 80;

  const load = estimateLoad({
    cpu: build.cpu,
    gpu: build.gpu,
    ram: build.ram,
    storage: build.storage ?? [],
  });

  // PSU headroom
  if (build.psu && load > 0) {
    const headroom = getHeadroom(build.psu.specs.wattage_w, load);
    if (headroom < 1.25) {
      score -= 15;
      breakdown.push({
        factor: "PSU headroom",
        impact: -15,
        explanation: `PSU headroom (${(headroom * 100).toFixed(0)}%) is below 125%. System may be unstable under peak loads.`,
      });
    } else if (headroom < 1.4) {
      score -= 5;
      breakdown.push({
        factor: "PSU headroom",
        impact: -5,
        explanation: `PSU headroom is ${(headroom * 100).toFixed(0)}%. Adequate but consider more for safety margin.`,
      });
    } else {
      score += 5;
      breakdown.push({
        factor: "PSU headroom",
        impact: 5,
        explanation: `PSU headroom is ${(headroom * 100).toFixed(0)}%. Good safety margin for peak loads.`,
      });
    }

    // Noise: PSU load > 75%
    if (headroom < 1.33) {
      score -= 10;
      breakdown.push({
        factor: "PSU load / noise",
        impact: -10,
        explanation: "PSU may run near capacity, potentially increasing fan noise.",
      });
    }
  } else if (!build.psu) {
    breakdown.push({
      factor: "PSU headroom",
      impact: 0,
      explanation: "No PSU selected. Select a PSU to assess headroom.",
    });
  }

  // Upgrade headroom
  if (build.motherboard) {
    const ramSlotsFree =
      build.motherboard.specs.ram_slots - (build.ram?.specs?.modules ?? 0);
    const nvmeCount =
      build.storage?.filter((s) => s.specs.interface === "NVMe").length ?? 0;
    const m2Free = build.motherboard.specs.m2_slots - nvmeCount;

    if (ramSlotsFree >= 2) {
      score += 10;
      breakdown.push({
        factor: "RAM upgrade room",
        impact: 10,
        explanation: `You have ${ramSlotsFree} RAM slots free for future upgrades.`,
      });
    } else if (ramSlotsFree >= 1) {
      score += 5;
      breakdown.push({
        factor: "RAM upgrade room",
        impact: 5,
        explanation: `${ramSlotsFree} RAM slot(s) free.`,
      });
    }

    if (m2Free >= 1) {
      score += 5;
      breakdown.push({
        factor: "M.2 upgrade room",
        impact: 5,
        explanation: `${m2Free} M.2 slot(s) free for additional storage.`,
      });
    }
  }

  // Poor airflow / high TDP: heuristic
  const totalTdp =
    (build.cpu?.specs?.tdp_w ?? 0) + (build.gpu?.specs?.tdp_w ?? 0);
  if (totalTdp > 400 && build.case?.specs?.form_factor === "Mini-ITX") {
    score -= 10;
    breakdown.push({
      factor: "Thermal consideration",
      impact: -10,
      explanation:
        "High TDP build in compact case. Ensure adequate cooling and airflow.",
    });
  }

  const value = Math.max(0, Math.min(100, Math.round(score)));
  const confidence = 70;

  const topFactors = breakdown
    .slice(0, 2)
    .map((b) => b.factor)
    .join(", ");
  const summary = `Usability score is ${value}. ${topFactors || "No major usability concerns."} See breakdown for details.`;

  return {
    value,
    confidence,
    weight: 0.15,
    breakdown,
    summary,
  };
}
