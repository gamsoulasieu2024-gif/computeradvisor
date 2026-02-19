import { describe, expect, it } from "vitest";
import { calculateScores } from "./engine";
import { calculateCompatibilityScore } from "./compatibility-score";
import { calculatePerformanceScore } from "./performance-score";
import { calculateValueScore } from "./value-score";
import { calculateUsabilityScore } from "./usability-score";
import { generateExplanations } from "./explanations";
import type { BuildInput } from "@/lib/compatibility/types";
import type { CompatibilityResult } from "@/lib/compatibility/types";
import type { CPU, GPU, Motherboard, RAM, Storage, PSU, Case } from "@/types/components";

// ============ Fixtures ============

const cpuMid: CPU = {
  id: "cpu-1",
  name: "Ryzen 5 7600",
  manufacturer: "AMD",
  price_usd: 229,
  specs: {
    brand: "AMD",
    socket: "AM5",
    cores: 6,
    threads: 12,
    base_clock_ghz: 3.8,
    boost_clock_ghz: 5.1,
    tdp_w: 65,
    max_mem_speed_mhz: 5200,
    memory_type: "DDR5",
    pcie_version: "5.0",
    has_igpu: true,
    tier: 6,
  },
};

const cpuHigh: CPU = {
  ...cpuMid,
  id: "cpu-high",
  price_usd: 449,
  specs: { ...cpuMid.specs, tier: 9 },
};


const gpuMid: GPU = {
  id: "gpu-1",
  name: "RTX 4070",
  manufacturer: "NVIDIA",
  price_usd: 549,
  specs: {
    brand: "NVIDIA",
    length_mm: 244,
    thickness_slots: 2,
    tdp_w: 200,
    power_connectors: ["8-pin"],
    pcie_version: "4.0",
    vram_gb: 12,
    tier: 7,
  },
};

const gpuLow: GPU = {
  ...gpuMid,
  id: "gpu-low",
  price_usd: 299,
  specs: { ...gpuMid.specs, tier: 5 },
};

const mb: Motherboard = {
  id: "mb-1",
  name: "B650",
  manufacturer: "MSI",
  price_usd: 179,
  specs: {
    socket: "AM5",
    chipset: "B650",
    form_factor: "ATX",
    memory_type: "DDR5",
    ram_slots: 4,
    max_ram_gb: 128,
    m2_slots: 2,
    sata_ports: 6,
    pcie_version: "5.0",
    has_bios_flashback: true,
  },
};

const ram: RAM = {
  id: "ram-1",
  name: "DDR5-6000",
  manufacturer: "G.Skill",
  price_usd: 99,
  specs: {
    memory_type: "DDR5",
    capacity_gb: 32,
    speed_mhz: 6000,
    modules: 2,
    latency: "CL36",
  },
};

const storage: Storage = {
  id: "ssd-1",
  name: "980 Pro",
  manufacturer: "Samsung",
  price_usd: 99,
  specs: {
    interface: "NVMe",
    form_factor: "M.2 2280",
    capacity_gb: 1000,
  },
};

const psu850: PSU = {
  id: "psu-850",
  name: "850W Gold",
  manufacturer: "Corsair",
  price_usd: 129,
  specs: {
    wattage_w: 850,
    efficiency: "80+ Gold",
    form_factor: "ATX",
    modular: "Fully modular",
    pcie_5_ready: true,
  },
};


const pcCase: Case = {
  id: "case-1",
  name: "H5 Flow",
  manufacturer: "NZXT",
  specs: {
    form_factor: "ATX",
    max_gpu_length_mm: 365,
    max_cooler_height_mm: 165,
    max_psu_length_mm: 180,
    drive_bays_2_5: 2,
    drive_bays_3_5: 2,
    expansion_slots: 7,
    max_psu_form_factor: "ATX",
  },
};

const compatClean: CompatibilityResult = {
  isCompatible: true,
  hardFails: [],
  warnings: [],
  notes: [],
  confidence: 100,
};

const compatWithWarnings: CompatibilityResult = {
  isCompatible: true,
  hardFails: [],
  warnings: [
    {
      id: "lowPsuHeadroom",
      category: "compatibility",
      severity: "warning",
      title: "Low PSU headroom",
      description: "PSU headroom is below 125%.",
      affectedParts: ["psu-1"],
    },
  ],
  notes: [],
  confidence: 90,
};

const compatWithFails: CompatibilityResult = {
  isCompatible: false,
  hardFails: [
    {
      id: "socketMismatch",
      category: "compatibility",
      severity: "critical",
      title: "Socket mismatch",
      description: "CPU and motherboard sockets do not match.",
      affectedParts: ["cpu-1", "mb-1"],
    },
  ],
  warnings: [],
  notes: [],
  confidence: 100,
};

// ============ Tests ============

describe("calculateScores", () => {
  it("returns ScoreResult with overall and all 4 scores", () => {
    const build: BuildInput = {
      cpu: cpuMid,
      gpu: gpuMid,
      motherboard: mb,
      ram,
      storage: [storage],
      psu: psu850,
      case: pcCase,
    };
    const result = calculateScores(build, compatClean);
    expect(result).toMatchObject({
      overall: expect.any(Number),
      scores: {
        compatibility: expect.objectContaining({ value: expect.any(Number), confidence: expect.any(Number) }),
        performance: expect.objectContaining({ value: expect.any(Number) }),
        value: expect.objectContaining({ value: expect.any(Number) }),
        usability: expect.objectContaining({ value: expect.any(Number) }),
      },
    });
  });

  it("overall is weighted average when compatibility >= 50", () => {
    const build: BuildInput = {
      cpu: cpuMid,
      gpu: gpuMid,
      motherboard: mb,
      ram,
      psu: psu850,
      case: pcCase,
    };
    const result = calculateScores(build, compatClean);
    expect(result.overall).toBeGreaterThanOrEqual(0);
    expect(result.overall).toBeLessThanOrEqual(100);
  });

  it("overall = compatibility * 0.5 when compatibility < 50", () => {
    const build: BuildInput = { cpu: cpuMid };
    const result = calculateScores(build, compatWithFails);
    expect(result.scores.compatibility.value).toBe(0);
    expect(result.overall).toBe(0);
  });
});

describe("Compatibility score", () => {
  it("hard fails → score 0", () => {
    const score = calculateCompatibilityScore(compatWithFails);
    expect(score.value).toBe(0);
    expect(score.breakdown.length).toBeGreaterThan(0);
  });

  it("warnings reduce score", () => {
    const score = calculateCompatibilityScore(compatWithWarnings);
    expect(score.value).toBeLessThan(100);
  });

  it("clean compat → score 100", () => {
    const score = calculateCompatibilityScore(compatClean);
    expect(score.value).toBe(100);
  });
});

describe("Performance score", () => {
  it("preset affects weighting: gaming favors GPU", () => {
    const build: BuildInput = { cpu: cpuMid, gpu: gpuMid };
    const gaming = calculatePerformanceScore(build, "gaming-1440p");
    const creator = calculatePerformanceScore(build, "creator");
    expect(gaming.value).not.toBe(creator.value);
  });

  it("no GPU: lower score, different calculation", () => {
    const buildNoGpu: BuildInput = { cpu: cpuMid };
    const buildWithGpu: BuildInput = { cpu: cpuMid, gpu: gpuMid };
    const scoreNoGpu = calculatePerformanceScore(buildNoGpu);
    const scoreWithGpu = calculatePerformanceScore(buildWithGpu);
    expect(scoreNoGpu.value).toBeLessThan(scoreWithGpu.value);
  });

  it("bottleneck penalty for gaming: CPU tier >> GPU tier", () => {
    const build: BuildInput = { cpu: cpuHigh, gpu: gpuLow };
    const score = calculatePerformanceScore(build, "gaming-1440p");
    const bottleneckItem = score.breakdown.find((b) => b.factor === "CPU/GPU balance");
    expect(bottleneckItem?.impact).toBe(-10);
  });
});

describe("Value score", () => {
  it("has prices: higher confidence", () => {
    const build: BuildInput = {
      cpu: cpuMid,
      gpu: gpuMid,
      ram,
      motherboard: mb,
    };
    const score = calculateValueScore(build);
    expect(score.confidence).toBe(80);
  });

  it("missing prices: lower confidence", () => {
    const buildNoPrices: BuildInput = {
      cpu: { ...cpuMid, price_usd: undefined },
      gpu: { ...gpuMid, price_usd: undefined },
    };
    const score = calculateValueScore(buildNoPrices);
    expect(score.confidence).toBe(50);
  });

  it("imbalance penalty: high CPU + low GPU for gaming", () => {
    const build: BuildInput = { cpu: cpuHigh, gpu: gpuLow };
    const score = calculateValueScore(build, "gaming-4k");
    const imbalance = score.breakdown.find((b) => b.factor === "Component imbalance");
    expect(imbalance?.impact).toBe(-15);
  });
});

describe("Usability score", () => {
  it("PSU headroom < 1.25: penalty", () => {
    const highTdpCpu: CPU = {
      ...cpuHigh,
      specs: { ...cpuHigh.specs, tdp_w: 125 },
    };
    const highTdpGpu: GPU = {
      ...gpuMid,
      specs: { ...gpuMid.specs, tdp_w: 350 },
    };
    const psu450: PSU = {
      ...psu850,
      specs: { ...psu850.specs, wattage_w: 450 },
    };
    const build: BuildInput = {
      cpu: highTdpCpu,
      gpu: highTdpGpu,
      psu: psu450,
    };
    const score = calculateUsabilityScore(build);
    const headroom = score.breakdown.find((b) => b.factor === "PSU headroom");
    expect(headroom?.impact).toBeLessThan(0);
  });

  it("upgrade room: +10 for 2+ RAM slots free", () => {
    const build: BuildInput = {
      motherboard: mb,
      ram: { ...ram, specs: { ...ram.specs, modules: 2 } },
      psu: psu850,
    };
    const score = calculateUsabilityScore(build);
    const ramUpgrade = score.breakdown.find((b) => b.factor === "RAM upgrade room");
    expect(ramUpgrade?.impact).toBeGreaterThan(0);
  });
});

describe("Edge cases", () => {
  it("handles empty build", () => {
    const result = calculateScores({}, compatClean);
    expect(result.overall).toBeDefined();
    expect(result.scores.performance.value).toBeDefined();
  });

  it("handles build with minimal components", () => {
    const build: BuildInput = { cpu: cpuMid };
    const result = calculateScores(build, compatClean);
    expect(result.scores.usability.breakdown).toBeDefined();
  });
});

describe("Explanations", () => {
  it("generates explanations for each score", () => {
    const build: BuildInput = {
      cpu: cpuMid,
      gpu: gpuMid,
      motherboard: mb,
      ram,
      psu: psu850,
      case: pcCase,
    };
    const result = calculateScores(build, compatClean);
    const explanations = generateExplanations(result);
    expect(explanations.compatibility).toBeTruthy();
    expect(explanations.performance).toBeTruthy();
    expect(explanations.value).toBeTruthy();
    expect(explanations.usability).toBeTruthy();
  });
});
