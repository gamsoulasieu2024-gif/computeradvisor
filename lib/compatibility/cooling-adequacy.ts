import type { CPU, Cooler } from "@/types/components";
import type { Issue } from "./types";

export interface CoolingAssessment {
  adequate: boolean;
  headroom: number; // percentage
  rating: "excellent" | "good" | "adequate" | "marginal" | "insufficient";
  recommendation: string;
}

/**
 * Assess if cooler is adequate for CPU
 */
export function assessCooling(
  cpu: CPU | undefined,
  cooler: Cooler | undefined
): CoolingAssessment | null {
  if (!cpu || !cooler) return null;

  const cpuTDP = cpu.specs?.tdp_w ?? 0;
  const coolerRating = cooler.specs?.tdp_rating_w ?? 0;

  if (cpuTDP === 0 || coolerRating === 0) return null;

  // Calculate headroom
  const headroom = ((coolerRating - cpuTDP) / cpuTDP) * 100;

  // Determine rating
  let rating: CoolingAssessment["rating"];
  let adequate: boolean;
  let recommendation: string;

  if (headroom >= 50) {
    rating = "excellent";
    adequate = true;
    recommendation =
      "Excellent cooling headroom. Can handle sustained loads and overclocking.";
  } else if (headroom >= 25) {
    rating = "good";
    adequate = true;
    recommendation =
      "Good cooling capacity. Comfortable for stock speeds.";
  } else if (headroom >= 10) {
    rating = "adequate";
    adequate = true;
    recommendation =
      "Adequate cooling. May run warm under heavy load.";
  } else if (headroom >= 0) {
    rating = "marginal";
    adequate = true;
    recommendation =
      "Marginal cooling. Will run hot under sustained load. Not recommended for overclocking.";
  } else {
    rating = "insufficient";
    adequate = false;
    recommendation =
      "Insufficient cooling capacity. CPU will thermal throttle under load.";
  }

  return {
    adequate,
    headroom,
    rating,
    recommendation,
  };
}

/**
 * Generate compatibility issue for inadequate cooling
 */
export function checkCoolingAdequacy(
  cpu: CPU | undefined,
  cooler: Cooler | undefined
): Issue | null {
  if (!cpu || !cooler) return null;

  const assessment = assessCooling(cpu, cooler);
  if (!assessment) return null;

  const cpuTDP = cpu.specs?.tdp_w ?? 0;
  const coolerRating = cooler.specs?.tdp_rating_w ?? 0;

  // Insufficient cooling - critical issue
  if (!assessment.adequate) {
    return {
      id: "cooling-insufficient",
      category: "cooling",
      severity: "critical",
      title: "Cooler Insufficient for CPU",
      description: `Your cooler (${coolerRating}W TDP rating) cannot adequately cool your CPU (${cpuTDP}W TDP). CPU will thermal throttle and lose performance.`,
      affectedParts: [cpu.id, cooler.id],
      suggestedFixes: [
        `Choose cooler with ${Math.ceil((cpuTDP * 1.2) / 10) * 10}W+ TDP rating`,
        "CPU will throttle to prevent overheating",
        "Performance will be significantly reduced",
      ],
      evidence: {
        values: {
          "CPU TDP": `${cpuTDP}W`,
          "Cooler rating": `${coolerRating}W`,
          Shortfall: `${cpuTDP - coolerRating}W`,
          Headroom: `${assessment.headroom.toFixed(0)}%`,
        },
        comparison: `${coolerRating}W < ${cpuTDP}W (insufficient)`,
        calculation: `Cooler needs ${cpuTDP - coolerRating}W more capacity`,
      },
    };
  }

  // Marginal cooling - warning
  if (assessment.rating === "marginal") {
    return {
      id: "cooling-marginal",
      category: "cooling",
      severity: "warning",
      title: "Cooler Barely Adequate",
      description: `Your cooler (${coolerRating}W) is marginally adequate for your CPU (${cpuTDP}W). Will work but run hot (80-90°C) under sustained load.`,
      affectedParts: [cpu.id, cooler.id],
      suggestedFixes: [
        `Upgrade to cooler with ${Math.ceil((cpuTDP * 1.25) / 10) * 10}W+ rating for comfort`,
        "Avoid overclocking",
        "Ensure good case airflow",
      ],
      evidence: {
        values: {
          "CPU TDP": `${cpuTDP}W`,
          "Cooler rating": `${coolerRating}W`,
          Headroom: `${assessment.headroom.toFixed(0)}%`,
          "Expected temps": "80-90°C under load",
        },
        comparison: `${coolerRating}W ≈ ${cpuTDP}W (tight)`,
        calculation: `Only ${assessment.headroom.toFixed(0)}% cooling headroom`,
      },
    };
  }

  // Good or excellent cooling - just info
  if (assessment.rating === "excellent" || assessment.rating === "good") {
    return {
      id: "cooling-good",
      category: "cooling",
      severity: "info",
      title:
        assessment.rating === "excellent" ? "Excellent Cooling" : "Good Cooling",
      description: assessment.recommendation,
      affectedParts: [cpu.id, cooler.id],
      evidence: {
        values: {
          "CPU TDP": `${cpuTDP}W`,
          "Cooler rating": `${coolerRating}W`,
          Headroom: `${assessment.headroom.toFixed(0)}%`,
          "Expected temps":
            assessment.rating === "excellent"
              ? "60-70°C under load"
              : "70-80°C under load",
        },
      },
    };
  }

  return null;
}
