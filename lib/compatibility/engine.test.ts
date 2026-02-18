import { describe, expect, it } from "vitest";
import { checkCompatibility } from "./engine";
import { estimateLoad } from "./power";
import type { BuildInput } from "./types";
import type { CPU, GPU, Motherboard, RAM, Storage, PSU, Cooler, Case } from "@/types/components";

// ============ Fixtures ============

const cpuAm5: CPU = {
  id: "cpu-am5",
  name: "Ryzen 5 7600",
  manufacturer: "AMD",
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

const cpuLga1700: CPU = {
  id: "cpu-intel",
  name: "Core i5-14600K",
  manufacturer: "Intel",
  specs: {
    brand: "Intel",
    socket: "LGA1700",
    cores: 14,
    threads: 20,
    base_clock_ghz: 3.5,
    boost_clock_ghz: 5.3,
    tdp_w: 125,
    max_mem_speed_mhz: 5600,
    memory_type: "DDR5",
    pcie_version: "5.0",
    has_igpu: true,
    tier: 7,
  },
};

const mbAm5: Motherboard = {
  id: "mb-am5",
  name: "B650 Board",
  manufacturer: "MSI",
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

const mbAm4B450NoFlashback: Motherboard = {
  id: "mb-am4-b450",
  name: "B450 Board",
  manufacturer: "MSI",
  specs: {
    socket: "AM4",
    chipset: "B450",
    form_factor: "ATX",
    memory_type: "DDR4",
    ram_slots: 4,
    max_ram_gb: 64,
    m2_slots: 1,
    sata_ports: 6,
    pcie_version: "4.0",
    has_bios_flashback: false,
  },
};

const cpuAm4: CPU = {
  id: "cpu-am4",
  name: "Ryzen 5 5600",
  manufacturer: "AMD",
  specs: {
    brand: "AMD",
    socket: "AM4",
    cores: 6,
    threads: 12,
    base_clock_ghz: 3.5,
    boost_clock_ghz: 4.4,
    tdp_w: 65,
    max_mem_speed_mhz: 3200,
    memory_type: "DDR4",
    pcie_version: "4.0",
    has_igpu: false,
    tier: 5,
  },
};

const mbLga1700: Motherboard = {
  id: "mb-intel",
  name: "Z790 Board",
  manufacturer: "ASUS",
  specs: {
    socket: "LGA1700",
    chipset: "Z790",
    form_factor: "ATX",
    memory_type: "DDR5",
    ram_slots: 4,
    max_ram_gb: 128,
    m2_slots: 3,
    sata_ports: 6,
    pcie_version: "5.0",
    has_bios_flashback: true,
  },
};

const mbNoM2: Motherboard = {
  ...mbAm5,
  id: "mb-no-m2",
  specs: { ...mbAm5.specs, m2_slots: 0 },
};

const ramDdr5: RAM = {
  id: "ram-ddr5",
  name: "DDR5-6000",
  manufacturer: "G.Skill",
  specs: {
    memory_type: "DDR5",
    capacity_gb: 32,
    speed_mhz: 6000,
    modules: 2,
    latency: "CL36",
  },
};

const ramDdr4: RAM = {
  id: "ram-ddr4",
  name: "DDR4-3600",
  manufacturer: "G.Skill",
  specs: {
    memory_type: "DDR4",
    capacity_gb: 32,
    speed_mhz: 3600,
    modules: 2,
    latency: "CL16",
  },
};

const gpuShort: GPU = {
  id: "gpu-short",
  name: "RTX 4070",
  manufacturer: "NVIDIA",
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

const gpuLong: GPU = {
  id: "gpu-long",
  name: "RTX 4090",
  manufacturer: "NVIDIA",
  specs: {
    brand: "NVIDIA",
    length_mm: 380,
    thickness_slots: 3,
    tdp_w: 450,
    power_connectors: ["16-pin"],
    pcie_version: "4.0",
    vram_gb: 24,
    tier: 10,
  },
};

const nvme: Storage = {
  id: "ssd-nvme",
  name: "980 Pro",
  manufacturer: "Samsung",
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
  specs: {
    wattage_w: 850,
    efficiency: "80+ Gold",
    form_factor: "ATX",
    modular: "Fully modular",
    pcie_5_ready: true,
  },
};

const psu400: PSU = {
  id: "psu-400",
  name: "400W",
  manufacturer: "Generic",
  specs: {
    wattage_w: 400,
    efficiency: "80+ Bronze",
    form_factor: "ATX",
    modular: "Non-modular",
    pcie_5_ready: false,
  },
};

const coolerAir: Cooler = {
  id: "cooler-air",
  name: "NH-D15",
  manufacturer: "Noctua",
  specs: {
    type: "Air",
    height_mm: 165,
    tdp_rating_w: 250,
    fan_size_mm: 140,
    sockets: ["AM5", "LGA1700"],
  },
};

const coolerAio: Cooler = {
  id: "cooler-aio",
  name: "Kraken 360",
  manufacturer: "NZXT",
  specs: {
    type: "AIO",
    radiator_size_mm: 360,
    fan_size_mm: 120,
    sockets: ["AM5", "LGA1700"],
  },
};

const caseAtx: Case = {
  id: "case-atx",
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

const caseTight: Case = {
  id: "case-tight",
  name: "SFF Case",
  manufacturer: "FormD",
  specs: {
    form_factor: "Mini-ITX",
    max_gpu_length_mm: 300,
    max_cooler_height_mm: 70,
    max_psu_length_mm: 130,
    drive_bays_2_5: 2,
    drive_bays_3_5: 0,
    expansion_slots: 2,
    max_psu_form_factor: "SFX",
  },
};

// ============ Tests ============

describe("checkCompatibility", () => {
  it("returns structured result for any build", () => {
    const result = checkCompatibility({});
    expect(result).toMatchObject({
      isCompatible: true,
      hardFails: expect.any(Array),
      warnings: expect.any(Array),
      notes: expect.any(Array),
      confidence: expect.any(Number),
    });
  });

  it("returns isCompatible true when no hard fails", () => {
    const build: BuildInput = {
      cpu: cpuAm5,
      motherboard: mbAm5,
      ram: ramDdr5,
      gpu: gpuShort,
      psu: psu850,
      case: caseAtx,
      cooler: coolerAir,
      storage: [nvme],
    };
    const result = checkCompatibility(build);
    expect(result.hardFails).toHaveLength(0);
    expect(result.isCompatible).toBe(true);
  });
});

describe("Hard fail rules", () => {
  it("socketMismatch: CPU socket !== motherboard socket", () => {
    const build: BuildInput = {
      cpu: cpuAm5,
      motherboard: mbLga1700,
    };
    const result = checkCompatibility(build);
    const issue = result.hardFails.find((i) => i.id === "socketMismatch");
    expect(issue).toBeDefined();
    expect(issue?.affectedParts).toContain(cpuAm5.id);
    expect(issue?.affectedParts).toContain(mbLga1700.id);
    expect(result.isCompatible).toBe(false);
  });

  it("ramTypeMismatch: RAM type !== motherboard memory_type", () => {
    const build: BuildInput = {
      ram: ramDdr4,
      motherboard: mbAm5,
    };
    const result = checkCompatibility(build);
    const issue = result.hardFails.find((i) => i.id === "ramTypeMismatch");
    expect(issue).toBeDefined();
    expect(result.isCompatible).toBe(false);
  });

  it("formFactorIncompatible: mATX board in ITX case", () => {
    const mbMatx: Motherboard = {
      ...mbAm5,
      specs: { ...mbAm5.specs, form_factor: "Micro-ATX" },
    };
    const build: BuildInput = {
      motherboard: mbMatx,
      case: { ...caseAtx, specs: { ...caseAtx.specs, form_factor: "Mini-ITX" } },
    };
    const result = checkCompatibility(build);
    const issue = result.hardFails.find((i) => i.id === "formFactorIncompatible");
    expect(issue).toBeDefined();
  });

  it("gpuTooLong: GPU exceeds case max length", () => {
    const build: BuildInput = {
      gpu: gpuLong,
      case: caseTight,
    };
    const result = checkCompatibility(build);
    const issue = result.hardFails.find((i) => i.id === "gpuTooLong");
    expect(issue).toBeDefined();
    expect(result.isCompatible).toBe(false);
  });

  it("coolerTooTall: air cooler exceeds case max height", () => {
    const build: BuildInput = {
      cooler: coolerAir,
      case: caseTight,
    };
    const result = checkCompatibility(build);
    const issue = result.hardFails.find((i) => i.id === "coolerTooTall");
    expect(issue).toBeDefined();
  });

  it("insufficientPower: PSU wattage < estimatedLoad * 1.05", () => {
    const build: BuildInput = {
      cpu: cpuLga1700,
      gpu: gpuLong,
      psu: psu400,
    };
    const result = checkCompatibility(build);
    const issue = result.hardFails.find((i) => i.id === "insufficientPower");
    expect(issue).toBeDefined();
  });

  it("noM2Slots: NVMe drives exceed motherboard M.2 slots", () => {
    const build: BuildInput = {
      motherboard: mbNoM2,
      storage: [nvme],
    };
    const result = checkCompatibility(build);
    const issue = result.hardFails.find((i) => i.id === "noM2Slots");
    expect(issue).toBeDefined();
  });

  it("noM2Slots: more NVMe drives than M.2 slots", () => {
    const build: BuildInput = {
      motherboard: mbAm5,
      storage: [nvme, { ...nvme, id: "nvme2" }, { ...nvme, id: "nvme3" }],
    };
    const result = checkCompatibility(build);
    const issue = result.hardFails.find((i) => i.id === "noM2Slots");
    expect(issue).toBeDefined();
  });

  it("insufficientPsuConnectors: GPU needs more connectors than PSU provides", () => {
    const gpu3x8: GPU = {
      ...gpuLong,
      specs: { ...gpuLong.specs, power_connectors: ["8-pin", "8-pin", "8-pin"] },
    };
    const build: BuildInput = {
      gpu: gpu3x8,
      psu: psu850,
    };
    const result = checkCompatibility(build, { psuPcieConnectors: 2 });
    const issue = result.hardFails.find((i) => i.id === "insufficientPsuConnectors");
    expect(issue).toBeDefined();
  });

  it("psuTooLong: PSU exceeds case max when length provided", () => {
    const build: BuildInput = {
      psu: psu850,
      case: caseTight,
    };
    const result = checkCompatibility(build, { psuLengthMm: 200 });
    const issue = result.hardFails.find((i) => i.id === "psuTooLong");
    expect(issue).toBeDefined();
  });
});

describe("Warning rules", () => {
  it("lowPsuHeadroom: PSU headroom < 1.25", () => {
    const build: BuildInput = {
      cpu: cpuLga1700,
      gpu: gpuLong,
      psu: psu850,
      case: caseAtx,
    };
    const result = checkCompatibility(build);
    const issue = result.warnings.find((i) => i.id === "lowPsuHeadroom");
    expect(issue).toBeDefined();
  });

  it("biosUpdateNeeded: triggers for B450 without flashback", () => {
    const build: BuildInput = {
      cpu: cpuAm4,
      motherboard: mbAm4B450NoFlashback,
    };
    const result = checkCompatibility(build);
    const issue = result.warnings.find((i) => i.id === "biosUpdateNeeded");
    expect(issue).toBeDefined();
  });

  it("gpuThicknessRisk: GPU thickness_slots > 2.5", () => {
    const build: BuildInput = {
      gpu: gpuLong,
      case: caseAtx,
    };
    const result = checkCompatibility(build);
    const issue = result.warnings.find((i) => i.id === "gpuThicknessRisk");
    expect(issue).toBeDefined();
  });

  it("ramSpeedRisk: RAM speed > CPU max_mem_speed", () => {
    const ramFast: RAM = { ...ramDdr5, specs: { ...ramDdr5.specs, speed_mhz: 6400 } };
    const build: BuildInput = {
      cpu: cpuAm5,
      ram: ramFast,
    };
    const result = checkCompatibility(build);
    const issue = result.warnings.find((i) => i.id === "ramSpeedRisk");
    expect(issue).toBeDefined();
  });

  it("radiatorConflict: AIO 360mm may reduce GPU clearance", () => {
    const build: BuildInput = {
      cooler: coolerAio,
      case: caseAtx,
    };
    const result = checkCompatibility(build);
    const issue = result.warnings.find((i) => i.id === "radiatorConflict");
    expect(issue).toBeDefined();
  });

  it("noUpgradeRoom: all RAM slots filled", () => {
    const ram4Sticks: RAM = {
      ...ramDdr5,
      specs: { ...ramDdr5.specs, modules: 4 },
    };
    const build: BuildInput = {
      motherboard: mbAm5,
      ram: ram4Sticks,
      storage: [nvme, { ...nvme, id: "nvme2" }],
    };
    const result = checkCompatibility(build);
    const issue = result.notes.find((i) => i.id === "noUpgradeRoom");
    expect(issue).toBeDefined();
  });
});

describe("Power estimation", () => {
  it("calculates load: base + cpu*1.2 + gpu*1.3", () => {
    const load = estimateLoad({ cpu: cpuLga1700, gpu: gpuShort });
    // 60 + 125*1.2 + 200*1.3 = 60 + 150 + 260 = 470
    expect(load).toBe(470);
  });

  it("includes RAM and storage in load", () => {
    const load = estimateLoad({
      cpu: cpuAm5,
      ram: ramDdr5,
      storage: [nvme, nvme],
    });
    expect(load).toBeGreaterThan(60);
  });
});

describe("Confidence score", () => {
  it("starts at 100 for complete build", () => {
    const build: BuildInput = {
      cpu: cpuAm5,
      motherboard: mbAm5,
      ram: ramDdr5,
      gpu: gpuShort,
      psu: psu850,
      case: caseAtx,
      cooler: coolerAir,
    };
    const result = checkCompatibility(build, { psuPcieConnectors: 3 });
    expect(result.confidence).toBe(100);
  });

  it("reduces for missing case clearances", () => {
    const caseIncomplete: Case = {
      ...caseAtx,
      specs: {
        ...caseAtx.specs,
        max_psu_length_mm: undefined,
      },
    };
    const build: BuildInput = { case: caseIncomplete };
    const result = checkCompatibility(build);
    expect(result.confidence).toBeLessThan(100);
  });

  it("reduces for manual override count", () => {
    const build: BuildInput = { cpu: cpuAm5 };
    const result = checkCompatibility(build, { manualOverrideCount: 4 });
    expect(result.confidence).toBe(100 - 4 * 5);
  });

  it("reduces when PSU connectors not provided", () => {
    const build: BuildInput = { cpu: cpuAm5, gpu: gpuShort, psu: psu850 };
    const result = checkCompatibility(build);
    expect(result.confidence).toBeLessThanOrEqual(90);
  });
});

describe("Multiple issues aggregate correctly", () => {
  it("collects all hard fails from incompatible build", () => {
    const build: BuildInput = {
      cpu: cpuAm5,
      motherboard: mbLga1700,
      ram: ramDdr4,
      gpu: gpuLong,
      psu: psu400,
      case: caseTight,
      storage: [nvme, nvme, nvme],
    };
    const result = checkCompatibility(build);
    expect(result.hardFails.length).toBeGreaterThanOrEqual(3);
    expect(result.isCompatible).toBe(false);
  });
});
