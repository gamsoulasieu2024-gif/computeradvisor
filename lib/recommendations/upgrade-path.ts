/**
 * Budget-based upgrade path with score impact and platform change detection
 */

import type { BuildInput } from "@/lib/compatibility/types";
import type { CPU, GPU, Motherboard, RAM, Storage, PSU, Case } from "@/types/components";
import type { PCComponent } from "@/types/components";
import { calculateScores } from "@/lib/scoring/engine";
import type { BuildPreset } from "@/lib/scoring/types";
import { checkCompatibility } from "@/lib/compatibility";
import type { Catalog } from "./engine";

export interface UpgradeOption {
  category: string;
  currentPart: PCComponent | undefined;
  suggestedPart: PCComponent;
  cost: number;
  scoreImpact: {
    overall: number;
    performance: number;
    value: number;
    compatibility: number;
  };
  reason: string;
  priority: "high" | "medium" | "low";
  platformChange?: PlatformChange;
  /** Parts to add when applying platform change (motherboard, psu, ram) */
  platformChangeParts?: {
    motherboard?: Motherboard;
    psu?: PSU;
    ram?: RAM;
  };
  valueRating: number;
}

export interface PlatformChange {
  type: "cpu_socket" | "ram_type" | "pcie_gen" | "motherboard_chipset";
  from: string;
  to: string;
  additionalCosts: Array<{
    part: string;
    estimatedCost: number;
  }>;
  totalCost: number;
  warning: string;
}

export interface BuildForUpgrade {
  selectedParts: BuildInput;
  preset?: string;
  targetId?: string;
}

export interface CurrentScores {
  overall: number;
  scores: {
    performance: { value: number };
    value: { value: number };
    compatibility: { value: number };
  };
}

function getPrice(part: { price_usd?: number } | undefined): number {
  return part?.price_usd ?? 0;
}

/**
 * Generate budget-filtered upgrade options ranked by value (score per $100)
 */
export function generateUpgradePath(
  build: BuildForUpgrade,
  currentScores: CurrentScores,
  budget: number,
  catalog: Catalog
): UpgradeOption[] {
  const upgrades: UpgradeOption[] = [];
  const { selectedParts } = build;
  const parts = {
    ...selectedParts,
    storage: selectedParts.storage ?? [],
  };

  if (selectedParts.cpu) {
    upgrades.push(
      ...findCpuUpgrades(
        selectedParts.cpu,
        selectedParts.motherboard,
        budget,
        catalog.cpus,
        catalog.motherboards
      )
    );
  }

  if (selectedParts.gpu) {
    upgrades.push(
      ...findGpuUpgrades(
        selectedParts.gpu,
        selectedParts.case,
        selectedParts.psu,
        budget,
        catalog.gpus,
        catalog.psus
      )
    );
  }

  if (selectedParts.ram) {
    upgrades.push(
      ...findRamUpgrades(
        selectedParts.ram,
        selectedParts.motherboard,
        budget,
        catalog.ram
      )
    );
  }

  upgrades.push(
    ...findStorageUpgrades(
      parts.storage,
      selectedParts.motherboard,
      budget,
      catalog.storage
    )
  );

  for (const upgrade of upgrades) {
    const simulatedParts = { ...parts };
    const cat = upgrade.category as keyof typeof simulatedParts;
    if (cat === "storage") {
      simulatedParts.storage = [
        ...(simulatedParts.storage ?? []),
        upgrade.suggestedPart as Storage,
      ];
    } else if (cat in simulatedParts) {
      (simulatedParts as Record<string, unknown>)[cat] = upgrade.suggestedPart;
    }

    const simulatedCompat = checkCompatibility(simulatedParts, {
      preset: build.preset,
    });
    const simulatedScores = calculateScores(simulatedParts, simulatedCompat, {
      preset: build.preset as BuildPreset | undefined,
      targetId: build.targetId,
    });

    upgrade.scoreImpact = {
      overall: simulatedScores.overall - currentScores.overall,
      performance:
        simulatedScores.scores.performance.value -
        currentScores.scores.performance.value,
      value:
        simulatedScores.scores.value.value - currentScores.scores.value.value,
      compatibility:
        simulatedScores.scores.compatibility.value -
        currentScores.scores.compatibility.value,
    };

    const totalCost =
      upgrade.cost + (upgrade.platformChange?.totalCost ?? 0);
    upgrade.valueRating =
      totalCost > 0 ? (upgrade.scoreImpact.overall / totalCost) * 100 : 0;
  }

  upgrades.sort((a, b) => b.valueRating - a.valueRating);

  const affordable = upgrades.filter((u) => {
    const total = u.cost + (u.platformChange?.totalCost ?? 0);
    return total <= budget * 1.2;
  });

  return affordable.slice(0, 10);
}

function findCpuUpgrades(
  currentCpu: CPU,
  motherboard: Motherboard | undefined,
  budget: number,
  cpuCatalog: CPU[],
  motherboardCatalog: Motherboard[]
): UpgradeOption[] {
  const upgrades: UpgradeOption[] = [];
  const currentTier = currentCpu.specs?.tier ?? 5;
  const currentSocket = currentCpu.specs?.socket;
  const moboSocket = motherboard?.specs?.socket;

  const sameSocketCpus = cpuCatalog.filter(
    (cpu) =>
      cpu.specs?.socket === moboSocket &&
      cpu.specs?.tier > currentTier &&
      getPrice(cpu) <= budget
  );

  for (const cpu of sameSocketCpus) {
    upgrades.push({
      category: "cpu",
      currentPart: currentCpu,
      suggestedPart: cpu,
      cost: getPrice(cpu),
      scoreImpact: { overall: 0, performance: 0, value: 0, compatibility: 0 },
      reason: `${(cpu.specs?.tier ?? 0) - currentTier} tier upgrade, same socket`,
      priority: (cpu.specs?.tier ?? 0) >= currentTier + 2 ? "high" : "medium",
      valueRating: 0,
    });
  }

  const betterCpus = cpuCatalog.filter(
    (cpu) =>
      cpu.specs?.socket !== moboSocket &&
      (cpu.specs?.tier ?? 0) > currentTier + 1
  );

  for (const cpu of betterCpus) {
    const compatMobos = motherboardCatalog.filter(
      (mb) =>
        mb.specs?.socket === cpu.specs?.socket &&
        mb.specs?.form_factor === motherboard?.specs?.form_factor
    );

    const cheapestMb = compatMobos.sort(
      (a, b) => getPrice(a) - getPrice(b)
    )[0];

    if (!cheapestMb) continue;

    const cpuCost = getPrice(cpu);
    const mbCost = getPrice(cheapestMb);

    const additionalCosts: Array<{ part: string; estimatedCost: number }> = [
      { part: "Motherboard", estimatedCost: mbCost },
    ];

    let ramUpgradeNeeded = false;
    if (
      motherboard?.specs?.memory_type !== cheapestMb.specs?.memory_type
    ) {
      additionalCosts.push({ part: "RAM (new type)", estimatedCost: 100 });
      ramUpgradeNeeded = true;
    }

    const platformTotal = additionalCosts.reduce((s, c) => s + c.estimatedCost, 0);
    const totalCost = cpuCost + platformTotal;

    if (totalCost > budget * 1.2) continue;

    const platformChange: PlatformChange = {
      type: ramUpgradeNeeded ? "ram_type" : "cpu_socket",
      from: `${currentSocket} / ${motherboard?.specs?.memory_type ?? "?"}`,
      to: `${cpu.specs?.socket} / ${cheapestMb.specs?.memory_type ?? "?"}`,
      additionalCosts,
      totalCost: platformTotal,
      warning: ramUpgradeNeeded
        ? `Requires new motherboard AND RAM (${motherboard?.specs?.memory_type} → ${cheapestMb.specs?.memory_type})`
        : "Requires new motherboard",
    };

    upgrades.push({
      category: "cpu",
      currentPart: currentCpu,
      suggestedPart: cpu,
      cost: cpuCost,
      scoreImpact: { overall: 0, performance: 0, value: 0, compatibility: 0 },
      reason: `Major ${(cpu.specs?.tier ?? 0) - currentTier} tier upgrade`,
      priority: "high",
      platformChange,
      valueRating: 0,
    });
  }

  return upgrades;
}

function findGpuUpgrades(
  currentGpu: GPU,
  pcCase: Case | undefined,
  psu: PSU | undefined,
  budget: number,
  gpuCatalog: GPU[],
  psuCatalog: PSU[]
): UpgradeOption[] {
  const upgrades: UpgradeOption[] = [];
  const currentTier = currentGpu.specs?.tier ?? 5;
  const maxLength = pcCase?.specs?.max_gpu_length_mm ?? 999;
  const maxThickness = pcCase?.specs?.max_gpu_thickness_slots ?? 4;

  const betterGpus = gpuCatalog.filter(
    (gpu) =>
      (gpu.specs?.tier ?? 0) > currentTier &&
      (gpu.specs?.length_mm ?? 0) <= maxLength &&
      (gpu.specs?.thickness_slots ?? 0) <= maxThickness &&
      getPrice(gpu) <= budget * 1.3
  );

  for (const gpu of betterGpus) {
    let platformChange: PlatformChange | undefined;
    let cheapestPsu: PSU | undefined;

    const gpuTdp = gpu.specs?.tdp_w ?? 0;
    const psuWattage = psu?.specs?.wattage_w ?? 0;
    const estimatedLoad = gpuTdp * 1.3 + 200;

    if (psuWattage < estimatedLoad * 1.25) {
      const recommendedWattage =
        Math.ceil((estimatedLoad * 1.3) / 50) * 50;

      const compatPsus = psuCatalog.filter(
        (p) => (p.specs?.wattage_w ?? 0) >= recommendedWattage
      );
      cheapestPsu = compatPsus.sort(
        (a, b) => getPrice(a) - getPrice(b)
      )[0];

      if (cheapestPsu) {
        platformChange = {
          type: "pcie_gen",
          from: `${psuWattage}W PSU`,
          to: `${cheapestPsu.specs?.wattage_w ?? 0}W PSU`,
          additionalCosts: [
            {
              part: "PSU",
              estimatedCost: getPrice(cheapestPsu),
            },
          ],
          totalCost: getPrice(cheapestPsu),
          warning: `Current PSU insufficient - recommend ${recommendedWattage}W+`,
        };
      }
    }

    const totalCost = getPrice(gpu) + (platformChange?.totalCost ?? 0);
    if (totalCost <= budget * 1.2) {
      upgrades.push({
        category: "gpu",
        currentPart: currentGpu,
        suggestedPart: gpu,
        cost: getPrice(gpu),
        scoreImpact: { overall: 0, performance: 0, value: 0, compatibility: 0 },
        reason: `${(gpu.specs?.tier ?? 0) - currentTier} tier GPU upgrade`,
        priority: (gpu.specs?.tier ?? 0) >= currentTier + 2 ? "high" : "medium",
        platformChange,
        platformChangeParts: cheapestPsu
          ? { psu: cheapestPsu }
          : undefined,
        valueRating: 0,
      });
    }
  }

  return upgrades;
}

function findRamUpgrades(
  currentRam: RAM,
  motherboard: Motherboard | undefined,
  budget: number,
  ramCatalog: RAM[]
): UpgradeOption[] {
  const upgrades: UpgradeOption[] = [];
  const currentCapacity = currentRam?.specs?.capacity_gb ?? 16;
  const memoryType = motherboard?.specs?.memory_type;

  const betterRam = ramCatalog.filter(
    (ram) =>
      ram.specs?.memory_type === memoryType &&
      (ram.specs?.capacity_gb ?? 0) > currentCapacity &&
      getPrice(ram) <= budget
  );

  for (const ram of betterRam) {
    upgrades.push({
      category: "ram",
      currentPart: currentRam,
      suggestedPart: ram,
      cost: getPrice(ram),
      scoreImpact: { overall: 0, performance: 0, value: 0, compatibility: 0 },
      reason: `${ram.specs?.capacity_gb ?? 0}GB upgrade from ${currentCapacity}GB`,
      priority: (ram.specs?.capacity_gb ?? 0) >= currentCapacity * 2 ? "high" : "low",
      valueRating: 0,
    });
  }

  return upgrades;
}

function findStorageUpgrades(
  currentStorage: Storage[],
  motherboard: Motherboard | undefined,
  budget: number,
  storageCatalog: Storage[]
): UpgradeOption[] {
  const upgrades: UpgradeOption[] = [];
  const totalCapacity = currentStorage.reduce(
    (sum, d) => sum + (d.specs?.capacity_gb ?? 0),
    0
  );

  const betterStorage = storageCatalog.filter(
    (drive) =>
      drive.specs?.interface === "NVMe" &&
      (drive.specs?.capacity_gb ?? 0) >= 1000 &&
      getPrice(drive) <= budget
  );

  for (const drive of betterStorage) {
    const cap = drive.specs?.capacity_gb ?? 0;
    if (cap <= totalCapacity) continue;

    upgrades.push({
      category: "storage",
      currentPart: undefined,
      suggestedPart: drive,
      cost: getPrice(drive),
      scoreImpact: { overall: 0, performance: 0, value: 0, compatibility: 0 },
      reason: `Add ${cap}GB NVMe storage`,
      priority: "low",
      valueRating: 0,
    });
  }

  return upgrades;
}
