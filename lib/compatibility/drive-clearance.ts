/**
 * 3.5" drive clearance in small form factor (ITX) cases
 */

import type { BuildInput } from "./types";
import type { Issue } from "./types";

function is35Drive(
  d: { specs?: { physical_size?: string; form_factor?: string } }
): boolean {
  if (d.specs?.physical_size === "3.5") return true;
  if (d.specs?.form_factor === "3.5\" SATA") return true;
  return false;
}

/**
 * Check if 3.5" drives cause clearance issues in small cases
 */
export function check35DriveClearance(build: BuildInput): Issue | null {
  const pcCase = build.case;
  const storage = build.storage ?? [];
  const gpu = build.gpu;
  const psu = build.psu;

  if (!pcCase) return null;

  const drive35List = storage.filter(is35Drive);
  const drive35Count = drive35List.length;

  if (drive35Count === 0) return null;

  const gpuReduction = pcCase.specs?.drive_35_reduces_gpu_length ?? 0;
  const psuReduction = pcCase.specs?.drive_35_reduces_psu_length ?? 0;
  const conflictsWith = pcCase.specs?.drive_35_conflicts_with;

  if (gpuReduction === 0 && psuReduction === 0) return null;

  const issues: string[] = [];
  const affectedSet = new Set<string>();
  affectedSet.add(pcCase.id);
  drive35List.forEach((d) => affectedSet.add(d.id));

  const caseMaxGpuLength = pcCase.specs?.max_gpu_length_mm ?? 350;
  const caseMaxPsuLength = pcCase.specs?.max_psu_length_mm ?? 180;

  if (gpuReduction > 0 && gpu) {
    const gpuLength = gpu.specs?.length_mm ?? 0;
    const effectiveGpuLength = caseMaxGpuLength - gpuReduction;

    if (gpuLength > effectiveGpuLength) {
      issues.push(
        `GPU (${gpuLength}mm) won't fit with 3.5" drive installed (${effectiveGpuLength}mm clearance)`
      );
      affectedSet.add(gpu.id);
    } else if (gpuLength > effectiveGpuLength - 10) {
      issues.push(
        `GPU clearance becomes very tight with 3.5" drive (${effectiveGpuLength}mm available)`
      );
      affectedSet.add(gpu.id);
    }
  }

  if (psuReduction > 0 && psu) {
    const psuLength =
      psu.specs?.length_mm ?? (psu.specs?.form_factor === "ATX" ? 160 : 130);
    const effectivePsuLength = caseMaxPsuLength - psuReduction;

    if (psuLength > effectivePsuLength) {
      issues.push(
        `PSU (${psuLength}mm) won't fit with 3.5" drive installed (${effectivePsuLength}mm clearance)`
      );
      affectedSet.add(psu.id);
    } else if (psuLength > effectivePsuLength - 10) {
      issues.push(
        `PSU clearance becomes very tight with 3.5" drive (${effectivePsuLength}mm available)`
      );
      affectedSet.add(psu.id);
    }
  }

  const affectedParts = Array.from(affectedSet);

  if (issues.length === 0) {
    return {
      id: "drive-35-clearance-info",
      category: "clearance",
      severity: "info",
      title: "3.5\" Drive Reduces Clearance",
      description: `Your 3.5" drive${drive35Count > 1 ? "s" : ""} will reduce ${
        conflictsWith === "both"
          ? "GPU and PSU"
          : conflictsWith === "gpu"
            ? "GPU"
            : "PSU"
      } clearance by ${gpuReduction || psuReduction}mm. Current components still fit.`,
      affectedParts,
      suggestedFixes: [
        "Consider 2.5\" SSD instead for better clearance",
        "Current configuration is compatible",
      ],
      evidence: {
        values: {
          "3.5\" drives": drive35Count.toString(),
          "GPU clearance reduction": gpuReduction ? `${gpuReduction}mm` : "None",
          "PSU clearance reduction": psuReduction ? `${psuReduction}mm` : "None",
        },
      },
    };
  }

  return {
    id: "drive-35-clearance-conflict",
    category: "clearance",
    severity: "critical",
    title: "3.5\" Drive Blocks Components",
    description: `Installing 3.5" drive${drive35Count > 1 ? "s" : ""} in this case causes clearance conflicts: ${issues.join("; ")}`,
    affectedParts,
    suggestedFixes: [
      "Remove 3.5\" drive and use 2.5\" SSD/HDD instead",
      "Choose shorter GPU or PSU",
      "Choose larger case that accommodates 3.5\" drives",
    ],
    evidence: {
      values: {
        "3.5\" drives installed": drive35Count.toString(),
        Case: pcCase.name,
        "GPU clearance with drive": `${caseMaxGpuLength - gpuReduction}mm`,
        "PSU clearance with drive": `${caseMaxPsuLength - psuReduction}mm`,
        Issues: issues.join("; "),
      },
      comparison: "3.5\" drive occupies space needed by other components",
      calculation: "Case clearances reduced by drive bay cage",
    },
  };
}
