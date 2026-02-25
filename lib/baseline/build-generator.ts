/**
 * Generate a baseline build from wizard answers and catalog
 */

import type { WizardAnswers } from "@/components/wizard/BuildGoalsWizard";
import type { SelectedParts } from "@/lib/store/types";
import type { CPU, GPU, Motherboard, RAM, Storage, PSU, Cooler, Case } from "@/types/components";

export type Catalog = {
  cpus: CPU[];
  gpus: GPU[];
  motherboards: Motherboard[];
  ram: RAM[];
  storage: Storage[];
  psus: PSU[];
  coolers: Cooler[];
  cases: Case[];
};

function getPrice(p: { price_usd?: number } | undefined): number {
  return p?.price_usd ?? 0;
}

/**
 * Generate a baseline build from wizard answers (sync; catalog must be loaded)
 */
export function generateBaselineBuild(
  answers: WizardAnswers,
  catalog: Catalog
): SelectedParts {
  const baseline: SelectedParts = {
    cpu: undefined,
    gpu: undefined,
    motherboard: undefined,
    ram: undefined,
    storage: [],
    psu: undefined,
    cooler: undefined,
    case: undefined,
  };

  const tiers = determineTiers(answers.useCase, answers.budget);
  const priorities = answers.priorities ?? [];

  baseline.case = selectCase(answers.size, catalog.cases);
  if (!baseline.case) return baseline;

  baseline.cpu = selectCPU(
    answers.useCase,
    tiers.cpu,
    priorities.includes("performance"),
    catalog.cpus
  );

  if (baseline.cpu) {
    baseline.motherboard = selectMotherboard(
      baseline.cpu,
      answers.size,
      priorities.includes("upgradability"),
      catalog.motherboards
    );
  }

  baseline.gpu = selectGPU(
    answers.useCase,
    tiers.gpu,
    baseline.case,
    catalog.gpus
  );

  baseline.ram = selectRAM(
    answers.useCase,
    baseline.motherboard,
    catalog.ram
  );

  baseline.storage = selectStorage(
    answers.useCase,
    answers.budget,
    catalog.storage
  );

  baseline.psu = selectPSU(
    baseline.cpu,
    baseline.gpu,
    priorities.includes("efficiency"),
    catalog.psus
  );

  baseline.cooler = selectCooler(
    baseline.cpu,
    baseline.case,
    priorities.includes("quiet"),
    priorities.includes("rgb"),
    catalog.coolers
  );

  return baseline;
}

function determineTiers(
  useCase: string,
  budget: string
): { cpu: number; gpu: number } {
  const budgetTiers: Record<string, { cpu: number; gpu: number }> = {
    "under-800": { cpu: 5, gpu: 5 },
    "800-1200": { cpu: 6, gpu: 7 },
    "1200-1800": { cpu: 7, gpu: 8 },
    "1800-plus": { cpu: 9, gpu: 9 },
  };
  let tiers = budgetTiers[budget] ?? { cpu: 6, gpu: 7 };

  if (useCase === "gaming") {
    tiers = {
      cpu: Math.max(5, tiers.cpu - 1),
      gpu: Math.min(10, tiers.gpu + 1),
    };
  } else if (useCase === "creator" || useCase === "workstation") {
    tiers = {
      cpu: Math.min(10, tiers.cpu + 1),
      gpu: Math.max(5, tiers.gpu - 1),
    };
  } else if (useCase === "home-office") {
    tiers = {
      cpu: Math.max(4, tiers.cpu - 2),
      gpu: Math.max(3, tiers.gpu - 3),
    };
  }

  return tiers;
}

const SIZE_TO_FORM_FACTOR: Record<string, "ATX" | "Micro-ATX" | "Mini-ITX" | "E-ATX"> = {
  "full-tower": "ATX",
  "mid-tower": "ATX",
  compact: "Micro-ATX",
  "mini-itx": "Mini-ITX",
};

function selectCase(size: string, cases: Case[]): Case | undefined {
  const formFactor = SIZE_TO_FORM_FACTOR[size] ?? "ATX";
  const compatible = cases.filter((c) => c.specs?.form_factor === formFactor);
  if (compatible.length === 0) return cases[0];
  compatible.sort((a, b) => getPrice(a) - getPrice(b));
  return compatible[Math.min(1, Math.floor(compatible.length / 2))];
}

function selectCPU(
  useCase: string,
  tier: number,
  performancePriority: boolean,
  cpus: CPU[]
): CPU | undefined {
  let targetTier = performancePriority ? Math.min(10, tier + 1) : tier;
  const suitable = cpus.filter(
    (c) =>
      (c.specs?.tier ?? 0) >= targetTier - 1 &&
      (c.specs?.tier ?? 0) <= targetTier + 1
  );
  if (suitable.length === 0) {
    const fallback = cpus.filter((c) => (c.specs?.tier ?? 0) >= 5);
    if (fallback.length === 0) return cpus[0];
    suitable.push(...fallback);
  }

  if (useCase === "gaming") {
    suitable.sort(
      (a, b) =>
        (b.specs?.base_clock_ghz ?? 0) - (a.specs?.base_clock_ghz ?? 0)
    );
  } else if (useCase === "creator" || useCase === "workstation") {
    suitable.sort((a, b) => (b.specs?.cores ?? 0) - (a.specs?.cores ?? 0));
  } else {
    suitable.sort((a, b) => getPrice(a) - getPrice(b));
  }
  return suitable[0];
}

function selectMotherboard(
  cpu: CPU,
  size: string,
  upgradability: boolean,
  motherboards: Motherboard[]
): Motherboard | undefined {
  const socket = cpu.specs?.socket;
  const memoryType = cpu.specs?.memory_type ?? "DDR4";
  const formFactor = SIZE_TO_FORM_FACTOR[size] ?? "ATX";

  const compatible = motherboards.filter(
    (mb) =>
      mb.specs?.socket === socket &&
      mb.specs?.form_factor === formFactor &&
      mb.specs?.memory_type === memoryType
  );
  if (compatible.length === 0) return undefined;

  if (upgradability) {
    compatible.sort((a, b) => {
      const aScore = (a.specs?.ram_slots ?? 0) + (a.specs?.m2_slots ?? 0);
      const bScore = (b.specs?.ram_slots ?? 0) + (b.specs?.m2_slots ?? 0);
      return bScore - aScore;
    });
  } else {
    compatible.sort((a, b) => getPrice(a) - getPrice(b));
  }
  return upgradability
    ? compatible[0]
    : compatible[Math.floor(compatible.length / 2)];
}

function selectGPU(
  useCase: string,
  tier: number,
  pcCase: Case | undefined,
  gpus: GPU[]
): GPU | undefined {
  const maxLength = pcCase?.specs?.max_gpu_length_mm ?? 400;
  const maxSlots = pcCase?.specs?.max_gpu_thickness_slots ?? 4;

  let suitable = gpus.filter(
    (g) =>
      (g.specs?.tier ?? 0) >= tier - 1 &&
      (g.specs?.length_mm ?? 0) <= maxLength &&
      (g.specs?.thickness_slots ?? 0) <= maxSlots
  );
  if (suitable.length === 0) {
    suitable = gpus.filter(
      (g) =>
        (g.specs?.length_mm ?? 0) <= maxLength &&
        (g.specs?.thickness_slots ?? 0) <= maxSlots
    );
  }
  if (suitable.length === 0) return undefined;

  suitable.sort((a, b) => {
    const aVal = (a.specs?.tier ?? 0) / (getPrice(a) || 1);
    const bVal = (b.specs?.tier ?? 0) / (getPrice(b) || 1);
    return bVal - aVal;
  });
  return suitable[0];
}

function selectRAM(
  useCase: string,
  motherboard: Motherboard | undefined,
  rams: RAM[]
): RAM | undefined {
  const memoryType = motherboard?.specs?.memory_type ?? "DDR4";
  const targetCapacity =
    useCase === "creator" || useCase === "workstation"
      ? 32
      : useCase === "gaming" || useCase === "mixed"
        ? 16
        : 8;

  const suitable = rams.filter(
    (r) =>
      r.specs?.memory_type === memoryType &&
      (r.specs?.capacity_gb ?? 0) >= targetCapacity
  );
  if (suitable.length === 0) {
    const fallback = rams.filter((r) => r.specs?.memory_type === memoryType);
    if (fallback.length === 0) return undefined;
    suitable.push(...fallback);
  }

  suitable.sort((a, b) => (a.specs?.speed_mhz ?? 0) - (b.specs?.speed_mhz ?? 0));
  const mid = suitable.find((r) => (r.specs?.capacity_gb ?? 0) === targetCapacity) ?? suitable[Math.floor(suitable.length / 2)];
  return mid;
}

function selectStorage(
  useCase: string,
  budget: string,
  storage: Storage[]
): Storage[] {
  const targetCapacity =
    useCase === "creator" || useCase === "workstation"
      ? 1000
      : budget === "1800-plus"
        ? 1000
        : budget === "under-800"
          ? 500
          : 500;

  const nvme = storage.filter(
    (s) =>
      s.specs?.interface === "NVMe" &&
      (s.specs?.capacity_gb ?? 0) >= targetCapacity
  );
  if (nvme.length === 0) {
    const fallback = storage.filter((s) => s.specs?.interface === "NVMe");
    if (fallback.length === 0) return [];
    nvme.push(...fallback);
  }

  nvme.sort((a, b) => getPrice(a) - getPrice(b));
  const pick = nvme[0];
  return pick ? [pick] : [];
}

function selectPSU(
  cpu: CPU | undefined,
  gpu: GPU | undefined,
  efficiency: boolean,
  psus: PSU[]
): PSU | undefined {
  const cpuTdp = cpu?.specs?.tdp_w ?? 65;
  const gpuTdp = gpu?.specs?.tdp_w ?? 0;
  const estimated =
    cpuTdp * 1.2 + gpuTdp * 1.3 + 60;
  const recommended = Math.ceil((estimated * 1.3) / 50) * 50;

  const suitable = psus.filter(
    (p) =>
      (p.specs?.wattage_w ?? 0) >= recommended &&
      (p.specs?.wattage_w ?? 0) <= recommended + 300
  );
  if (suitable.length === 0) {
    const fallback = psus.filter((p) => (p.specs?.wattage_w ?? 0) >= recommended);
    if (fallback.length === 0) return psus.find((p) => (p.specs?.wattage_w ?? 0) >= 550);
    suitable.push(...fallback);
  }

  const efficiencyOrder: Record<string, number> = {
    "80+ Titanium": 5,
    "80+ Platinum": 4,
    "80+ Gold": 3,
    "80+ Silver": 2,
    "80+ Bronze": 1,
  };
  if (efficiency) {
    suitable.sort(
      (a, b) =>
        (efficiencyOrder[b.specs?.efficiency ?? ""] ?? 0) -
        (efficiencyOrder[a.specs?.efficiency ?? ""] ?? 0)
    );
  } else {
    suitable.sort((a, b) => getPrice(a) - getPrice(b));
  }
  return suitable[0];
}

function selectCooler(
  cpu: CPU | undefined,
  pcCase: Case | undefined,
  quiet: boolean,
  rgb: boolean,
  coolers: Cooler[]
): Cooler | undefined {
  const cpuTdp = cpu?.specs?.tdp_w ?? 65;
  const maxHeight = pcCase?.specs?.max_cooler_height_mm ?? 165;

  let suitable = coolers.filter((c) => {
    const tdp = c.specs?.tdp_rating_w ?? 0;
    const height = c.specs?.height_mm ?? 0;
    if (c.specs?.type === "AIO") return tdp >= cpuTdp * 0.8;
    return tdp >= cpuTdp * 1.1 && height <= maxHeight;
  });
  if (suitable.length === 0) {
    suitable = coolers.filter(
      (c) =>
        (c.specs?.height_mm ?? 200) <= maxHeight ||
        c.specs?.type === "AIO"
    );
  }
  if (suitable.length === 0) return undefined;

  if (quiet) {
    suitable.sort(
      (a, b) =>
        (b.specs?.tdp_rating_w ?? 0) - (a.specs?.tdp_rating_w ?? 0)
    );
  }
  if (rgb) {
    const withRgb = suitable.filter(
      (c) => c.specs?.rgb_type && c.specs.rgb_type !== "none"
    );
    if (withRgb.length > 0) return withRgb[0];
  }
  return suitable[0];
}
