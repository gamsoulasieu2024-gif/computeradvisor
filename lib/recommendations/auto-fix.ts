/**
 * Auto-fix compatibility issues with cheapest or performance-focused strategies
 */

import type { CPU, GPU, Motherboard, RAM, Storage, PSU, Cooler, Case } from "@/types/components";
import type { FormFactor } from "@/types/components";
import type { Issue } from "@/lib/compatibility/types";
import { checkCompatibility } from "@/lib/compatibility";
import { estimateLoad } from "@/lib/compatibility/power";

export type FixStrategy = "cheapest" | "performance";

export interface AutoFix {
  issueId: string;
  action: "replace" | "add" | "remove" | "upgrade";
  category: string;
  oldPart?: CPU | GPU | Motherboard | RAM | Storage | PSU | Cooler | Case;
  newPart?: CPU | GPU | Motherboard | RAM | Storage | PSU | Cooler | Case;
  reason: string;
  priceImpact?: number;
  performanceImpact?: "better" | "same" | "worse";
}

export interface AutoFixPlan {
  strategy: FixStrategy;
  fixes: AutoFix[];
  totalPriceImpact: number;
  issuesFixed: string[];
  issuesRemaining: string[];
  newCompatResult?: ReturnType<typeof checkCompatibility>;
}

export interface BuildForAutoFix {
  selectedParts: {
    cpu?: CPU;
    gpu?: GPU;
    motherboard?: Motherboard;
    ram?: RAM;
    storage?: Storage[];
    psu?: PSU;
    cooler?: Cooler;
    case?: Case;
  };
  preset?: string;
}

export interface Catalog {
  cpus: CPU[];
  gpus: GPU[];
  motherboards: Motherboard[];
  ram: RAM[];
  storage: Storage[];
  psus: PSU[];
  coolers: Cooler[];
  cases: Case[];
}

const FORM_FACTOR_HIERARCHY: Record<FormFactor, FormFactor[]> = {
  "E-ATX": ["E-ATX", "ATX", "Micro-ATX", "Mini-ITX"],
  ATX: ["ATX", "Micro-ATX", "Mini-ITX"],
  "Micro-ATX": ["Micro-ATX", "Mini-ITX"],
  "Mini-ITX": ["Mini-ITX"],
};

function getPrice(part: { price_usd?: number } | undefined): number {
  return part?.price_usd ?? 0;
}

/**
 * Generate auto-fix plan for compatibility issues
 */
export async function generateAutoFixPlan(
  build: BuildForAutoFix,
  issues: Issue[],
  strategy: FixStrategy,
  catalog: Catalog
): Promise<AutoFixPlan> {
  const fixes: AutoFix[] = [];
  let totalPriceImpact = 0;
  const fixableIssueIds: string[] = [];
  const unfixableIssueIds: string[] = [];

  const sortedIssues = [...issues].sort((a, b) => {
    if (a.severity === "critical" && b.severity !== "critical") return -1;
    if (a.severity !== "critical" && b.severity === "critical") return 1;
    return 0;
  });

  let currentBuild = { ...build };

  for (const issue of sortedIssues) {
    const fix = generateFixForIssue(
      issue,
      currentBuild,
      catalog,
      strategy
    );

    if (fix) {
      fixes.push(fix);
      fixableIssueIds.push(issue.id);
      if (fix.priceImpact != null) totalPriceImpact += fix.priceImpact;
      if (fix.newPart && fix.category) {
        currentBuild = applySingleFix(currentBuild, fix);
      }
    } else {
      unfixableIssueIds.push(issue.id);
    }
  }

  const fixedBuild = applyFixesToBuild(build, fixes);
  const newCompatResult = checkCompatibility(
    { ...fixedBuild.selectedParts, storage: fixedBuild.selectedParts.storage ?? [] },
    { preset: build.preset }
  );

  return {
    strategy,
    fixes,
    totalPriceImpact,
    issuesFixed: fixableIssueIds,
    issuesRemaining: unfixableIssueIds,
    newCompatResult,
  };
}

function applySingleFix(
  build: BuildForAutoFix,
  fix: AutoFix
): BuildForAutoFix {
  const next = JSON.parse(JSON.stringify(build)) as BuildForAutoFix;
  if (fix.action === "replace" && fix.newPart && fix.category) {
    const key = fix.category as keyof typeof next.selectedParts;
    if (key === "storage") {
      if (Array.isArray(next.selectedParts.storage) && next.selectedParts.storage.length > 0) {
        next.selectedParts.storage = [fix.newPart as Storage];
      }
    } else if (key in next.selectedParts) {
      (next.selectedParts as Record<string, unknown>)[key] = fix.newPart;
    }
  }
  return next;
}

function applyFixesToBuild(
  build: BuildForAutoFix,
  fixes: AutoFix[]
): BuildForAutoFix {
  const next = JSON.parse(JSON.stringify(build)) as BuildForAutoFix;
  for (const fix of fixes) {
    if (fix.action === "replace" && fix.newPart && fix.category) {
      const key = fix.category as keyof typeof next.selectedParts;
      if (key === "storage") {
        if (Array.isArray(next.selectedParts.storage) && next.selectedParts.storage.length > 0) {
          next.selectedParts.storage = [fix.newPart as Storage];
        }
      } else if (key in next.selectedParts) {
        (next.selectedParts as Record<string, unknown>)[key] = fix.newPart;
      }
    }
  }
  return next;
}

function generateFixForIssue(
  issue: Issue,
  build: BuildForAutoFix,
  catalog: Catalog,
  strategy: FixStrategy
): AutoFix | null {
  const { selectedParts } = build;

  if (issue.id === "gpuTooLong") {
    const currentGpu = selectedParts.gpu;
    const currentCase = selectedParts.case;
    const maxLength = currentCase?.specs?.max_gpu_length_mm ?? 0;
    const gpuLength = currentGpu?.specs?.length_mm ?? 0;
    const mbFormFactor = selectedParts.motherboard?.specs?.form_factor;

    const caseSupportsMb = (c: Case) =>
      mbFormFactor && FORM_FACTOR_HIERARCHY[c.specs.form_factor]?.includes(mbFormFactor);

    if (strategy === "cheapest") {
      const compatibleCases = catalog.cases.filter(
        (c) =>
          (c.specs?.max_gpu_length_mm ?? 0) >= gpuLength && caseSupportsMb(c)
      );
      const cheaperCase = compatibleCases
        .filter((c) => getPrice(c) < getPrice(currentCase))
        .sort((a, b) => getPrice(a) - getPrice(b))[0];

      if (cheaperCase) {
        return {
          issueId: issue.id,
          action: "replace",
          category: "case",
          oldPart: currentCase,
          newPart: cheaperCase,
          reason: `Larger case fits your GPU (${cheaperCase.specs.max_gpu_length_mm}mm clearance)`,
          priceImpact: getPrice(cheaperCase) - getPrice(currentCase),
          performanceImpact: "same",
        };
      }

      const compatibleGpus = catalog.gpus.filter(
        (g) =>
          (g.specs?.length_mm ?? 0) <= maxLength &&
          (g.specs?.tier ?? 5) >= (currentGpu?.specs?.tier ?? 5) - 1
      );
      const cheaperGpu = compatibleGpus
        .sort((a, b) => getPrice(a) - getPrice(b))[0];

      if (cheaperGpu) {
        return {
          issueId: issue.id,
          action: "replace",
          category: "gpu",
          oldPart: currentGpu,
          newPart: cheaperGpu,
          reason: `Shorter GPU fits in case (${cheaperGpu.specs.length_mm}mm vs ${maxLength}mm max)`,
          priceImpact: getPrice(cheaperGpu) - getPrice(currentGpu),
          performanceImpact:
            (cheaperGpu.specs?.tier ?? 5) < (currentGpu?.specs?.tier ?? 5)
              ? "worse"
              : "same",
        };
      }
    } else {
      const compatibleCases = catalog.cases.filter(
        (c) =>
          (c.specs?.max_gpu_length_mm ?? 0) >= gpuLength && caseSupportsMb(c)
      );
      const bestCase = compatibleCases.sort(
        (a, b) => getPrice(b) - getPrice(a)
      )[0];

      if (bestCase) {
        return {
          issueId: issue.id,
          action: "replace",
          category: "case",
          oldPart: currentCase,
          newPart: bestCase,
          reason: `Premium case with ample clearance (${bestCase.specs.max_gpu_length_mm}mm)`,
          priceImpact: getPrice(bestCase) - getPrice(currentCase),
          performanceImpact: "same",
        };
      }
    }
  }

  if (issue.id === "socketMismatch") {
    const currentCpu = selectedParts.cpu;
    const currentMobo = selectedParts.motherboard;

    if (strategy === "cheapest") {
      const compatCpus = catalog.cpus.filter(
        (c) =>
          c.specs?.socket === currentMobo?.specs?.socket &&
          (c.specs?.tier ?? 5) >= (currentCpu?.specs?.tier ?? 5) - 1
      );
      const cheapestCpu = compatCpus.sort(
        (a, b) => getPrice(a) - getPrice(b)
      )[0];

      const compatMobos = catalog.motherboards.filter(
        (m) =>
          m.specs?.socket === currentCpu?.specs?.socket &&
          m.specs?.form_factor === currentMobo?.specs?.form_factor &&
          m.specs?.memory_type === currentMobo?.specs?.memory_type
      );
      const cheapestMobo = compatMobos.sort(
        (a, b) => getPrice(a) - getPrice(b)
      )[0];

      const cpuDelta = getPrice(cheapestCpu) - getPrice(currentCpu);
      const moboDelta = getPrice(cheapestMobo) - getPrice(currentMobo);

      if (cheapestCpu && (cpuDelta <= moboDelta || !cheapestMobo)) {
        return {
          issueId: issue.id,
          action: "replace",
          category: "cpu",
          oldPart: currentCpu,
          newPart: cheapestCpu,
          reason: `Compatible with ${currentMobo?.specs?.socket} motherboard`,
          priceImpact: cpuDelta,
          performanceImpact:
            (cheapestCpu.specs?.tier ?? 5) < (currentCpu?.specs?.tier ?? 5)
              ? "worse"
              : "same",
        };
      }
      if (cheapestMobo) {
        return {
          issueId: issue.id,
          action: "replace",
          category: "motherboard",
          oldPart: currentMobo,
          newPart: cheapestMobo,
          reason: `Compatible with ${currentCpu?.specs?.socket} CPU`,
          priceImpact: moboDelta,
          performanceImpact: "same",
        };
      }
    } else {
      const compatMobos = catalog.motherboards.filter(
        (m) =>
          m.specs?.socket === currentCpu?.specs?.socket &&
          m.specs?.form_factor === currentMobo?.specs?.form_factor
      );
      const bestMobo = compatMobos.sort(
        (a, b) => getPrice(b) - getPrice(a)
      )[0];

      if (bestMobo) {
        return {
          issueId: issue.id,
          action: "replace",
          category: "motherboard",
          oldPart: currentMobo,
          newPart: bestMobo,
          reason: `High-quality board for your ${currentCpu?.name}`,
          priceImpact: getPrice(bestMobo) - getPrice(currentMobo),
          performanceImpact: "better",
        };
      }
    }
  }

  if (issue.id === "gpuTooThick") {
    const currentGpu = selectedParts.gpu;
    const currentCase = selectedParts.case;
    const maxThickness = currentCase?.specs?.max_gpu_thickness_slots ?? 3;

    const compatibleGpus = catalog.gpus.filter(
      (g) => (g.specs?.thickness_slots ?? 0) <= maxThickness
    );

    if (strategy === "cheapest") {
      const cheaperGpu = compatibleGpus
        .filter((g) => getPrice(g) < getPrice(currentGpu))
        .sort((a, b) => getPrice(a) - getPrice(b))[0];

      if (cheaperGpu) {
        return {
          issueId: issue.id,
          action: "replace",
          category: "gpu",
          oldPart: currentGpu,
          newPart: cheaperGpu,
          reason: `Slimmer GPU fits in case (${cheaperGpu.specs.thickness_slots} slots)`,
          priceImpact: getPrice(cheaperGpu) - getPrice(currentGpu),
          performanceImpact:
            (cheaperGpu.specs?.tier ?? 5) < (currentGpu?.specs?.tier ?? 5)
              ? "worse"
              : "same",
        };
      }
    } else {
      const bestGpu = compatibleGpus.sort(
        (a, b) => (b.specs?.tier ?? 0) - (a.specs?.tier ?? 0)
      )[0];
      if (bestGpu) {
        return {
          issueId: issue.id,
          action: "replace",
          category: "gpu",
          oldPart: currentGpu,
          newPart: bestGpu,
          reason: `Best GPU that fits (${bestGpu.specs.thickness_slots} slots)`,
          priceImpact: getPrice(bestGpu) - getPrice(currentGpu),
          performanceImpact: "same",
        };
      }
    }
  }

  const estimatedLoad = estimateLoad({
    cpu: selectedParts.cpu,
    gpu: selectedParts.gpu,
    ram: selectedParts.ram,
    storage: selectedParts.storage ?? [],
  });

  if (
    issue.id === "lowPsuHeadroom" ||
    issue.id === "insufficientPower"
  ) {
    const currentPsu = selectedParts.psu;
    const recommendedWattage = Math.ceil((estimatedLoad * 1.3) / 50) * 50;

    const compatiblePsus = catalog.psus.filter(
      (p) => (p.specs?.wattage_w ?? 0) >= recommendedWattage
    );

    if (strategy === "cheapest") {
      const cheapestPsu = compatiblePsus.sort(
        (a, b) => getPrice(a) - getPrice(b)
      )[0];

      if (cheapestPsu) {
        return {
          issueId: issue.id,
          action: "replace",
          category: "psu",
          oldPart: currentPsu,
          newPart: cheapestPsu,
          reason: `${cheapestPsu.specs.wattage_w}W provides adequate headroom`,
          priceImpact: getPrice(cheapestPsu) - getPrice(currentPsu),
          performanceImpact: "same",
        };
      }
    } else {
      const atx30Psus = compatiblePsus.filter(
        (p) =>
          p.specs?.atx_standard === "ATX3.0" ||
          p.specs?.atx_standard === "ATX3.1" ||
          p.specs?.atx_version === "3.0"
      );
      const bestPsu = (atx30Psus.length ? atx30Psus : compatiblePsus).sort(
        (a, b) => (b.specs?.wattage_w ?? 0) - (a.specs?.wattage_w ?? 0)
      )[0];

      if (bestPsu) {
        return {
          issueId: issue.id,
          action: "replace",
          category: "psu",
          oldPart: currentPsu,
          newPart: bestPsu,
          reason: `Premium PSU with ${bestPsu.specs.atx_standard ?? bestPsu.specs.atx_version ?? "ATX"} and ${bestPsu.specs.efficiency} efficiency`,
          priceImpact: getPrice(bestPsu) - getPrice(currentPsu),
          performanceImpact: "better",
        };
      }
    }
  }

  if (issue.id === "ramTypeMismatch") {
    const currentRam = selectedParts.ram;
    const requiredType = selectedParts.motherboard?.specs?.memory_type;

    const compatibleRam = catalog.ram.filter(
      (r) => r.specs?.memory_type === requiredType
    );

    const targetRam =
      strategy === "cheapest"
        ? compatibleRam.sort((a, b) => getPrice(a) - getPrice(b))[0]
        : compatibleRam.sort(
            (a, b) => (b.specs?.speed_mhz ?? 0) - (a.specs?.speed_mhz ?? 0)
          )[0];

    if (targetRam) {
      return {
        issueId: issue.id,
        action: "replace",
        category: "ram",
        oldPart: currentRam,
        newPart: targetRam,
        reason: `${targetRam.specs.memory_type} compatible with motherboard`,
        priceImpact: getPrice(targetRam) - getPrice(currentRam),
        performanceImpact: "same",
      };
    }
  }

  if (
    issue.id === "insufficient-8pin" ||
    issue.id === "missing-12vhpwr" ||
    issue.id === "insufficientPsuConnectors"
  ) {
    const currentPsu = selectedParts.psu;
    const currentGpu = selectedParts.gpu;
    const needs12VHPWR =
      issue.id === "missing-12vhpwr" ||
      (issue.id === "insufficientPsuConnectors" &&
        currentGpu?.specs?.power_connectors?.some(
          (c) =>
            String(c).includes("16pin") ||
            String(c).includes("12vhpwr") ||
            c === "16-pin"
        ));

    let compatiblePsus = catalog.psus;

    if (needs12VHPWR) {
      compatiblePsus = compatiblePsus.filter(
        (p) =>
          (p.specs?.connectors?.pin_16_12vhpwr ?? 0) > 0 ||
          (p.specs?.connectors?.pin_8_pcie ?? 0) >= 2
      );
    } else {
      const required8pin =
        parseInt(
          String(issue.evidence?.values?.Required ?? "2").match(/\d+/)?.[0] ?? "2",
          10
        ) || 2;
      compatiblePsus = compatiblePsus.filter(
        (p) => (p.specs?.connectors?.pin_8_pcie ?? 0) >= required8pin
      );
    }

    compatiblePsus = compatiblePsus.filter(
      (p) => (p.specs?.wattage_w ?? 0) >= estimatedLoad * 1.2
    );

    const targetPsu =
      strategy === "cheapest"
        ? compatiblePsus.sort((a, b) => getPrice(a) - getPrice(b))[0]
        : compatiblePsus
            .filter(
              (p) =>
                p.specs?.atx_standard === "ATX3.0" ||
                p.specs?.atx_version === "3.0"
            )
            .sort(
              (a, b) =>
                (b.specs?.wattage_w ?? 0) - (a.specs?.wattage_w ?? 0)
            )[0] ?? compatiblePsus.sort(
              (a, b) => (b.specs?.wattage_w ?? 0) - (a.specs?.wattage_w ?? 0)
            )[0];

    if (targetPsu) {
      return {
        issueId: issue.id,
        action: "replace",
        category: "psu",
        oldPart: currentPsu,
        newPart: targetPsu,
        reason: needs12VHPWR
          ? `Native 12VHPWR connector for ${currentGpu?.name ?? "GPU"}`
          : "Sufficient PCIe power connectors",
        priceImpact: getPrice(targetPsu) - getPrice(currentPsu),
        performanceImpact: needs12VHPWR ? "better" : "same",
      };
    }
  }

  return null;
}
