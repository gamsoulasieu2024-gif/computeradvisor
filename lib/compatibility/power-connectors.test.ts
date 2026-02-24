import { describe, it, expect } from "vitest";
import { checkPowerConnectors, checkAtxStandard } from "./power-connectors";
import type { GPU, PSU } from "@/types/components";

function gpu16pin(id: string, name: string, tdp: number, peak?: number): GPU {
  return {
    id,
    name,
    manufacturer: "NVIDIA",
    specs: {
      brand: "NVIDIA",
      length_mm: 304,
      thickness_slots: 3,
      tdp_w: tdp,
      peak_power_w: peak,
      power_connectors: ["16-pin"],
      pcie_version: "4.0",
      vram_gb: 16,
      tier: 9,
    },
  };
}

function gpu2x8(id: string, name: string): GPU {
  return {
    id,
    name,
    manufacturer: "NVIDIA",
    specs: {
      brand: "NVIDIA",
      length_mm: 285,
      thickness_slots: 2.5,
      tdp_w: 320,
      power_connectors: ["8-pin", "8-pin"],
      pcie_version: "4.0",
      vram_gb: 10,
      tier: 7,
    },
  };
}

function psuAtx30With16pin(): PSU {
  return {
    id: "psu-atx30",
    name: "Corsair RM1000e",
    manufacturer: "Corsair",
    specs: {
      wattage_w: 1000,
      efficiency: "80+ Gold",
      form_factor: "ATX",
      modular: "Fully modular",
      atx_version: "3.0",
      atx_standard: "ATX3.0",
      pcie_5_ready: true,
      connectors: {
        pin_24_main: 1,
        pin_8_cpu: 2,
        pin_8_pcie: 4,
        pin_16_12vhpwr: 1,
        sata: 6,
        molex: 4,
      },
    },
  };
}

function psuAtx2xWithFour8pin(): PSU {
  return {
    id: "psu-atx2",
    name: "EVGA 850 G6",
    manufacturer: "EVGA",
    specs: {
      wattage_w: 850,
      efficiency: "80+ Gold",
      form_factor: "ATX",
      modular: "Fully modular",
      atx_version: "2.x",
      atx_standard: "ATX2.x",
      pcie_5_ready: false,
      connectors: {
        pin_24_main: 1,
        pin_8_cpu: 2,
        pin_8_pcie: 4,
        sata: 6,
        molex: 3,
      },
    },
  };
}

function psuAtx2xWithOne8pin(): PSU {
  return {
    id: "psu-atx2-low",
    name: "550W Bronze",
    manufacturer: "Generic",
    specs: {
      wattage_w: 550,
      efficiency: "80+ Bronze",
      form_factor: "ATX",
      modular: "Non-modular",
      atx_version: "2.x",
      atx_standard: "ATX2.x",
      pcie_5_ready: false,
      connectors: {
        pin_24_main: 1,
        pin_8_cpu: 1,
        pin_8_pcie: 1,
        sata: 4,
        molex: 3,
      },
    },
  };
}

describe("checkPowerConnectors", () => {
  it("RTX 4080 (16-pin) + ATX 3.0 PSU with native 16-pin → no issues", () => {
    const gpu = gpu16pin("gpu-4080", "RTX 4080", 320, 480);
    const psu = psuAtx30With16pin();
    const issues = checkPowerConnectors(gpu, psu);
    expect(issues).toHaveLength(0);
  });

  it("RTX 4080 (16-pin) + ATX 2.x PSU with 2+ 8-pins → adapter warning", () => {
    const gpu = gpu16pin("gpu-4080", "RTX 4080", 320, 480);
    const psu = psuAtx2xWithFour8pin();
    const issues = checkPowerConnectors(gpu, psu);
    expect(issues.length).toBeGreaterThanOrEqual(1);
    const missing12v = issues.find((i) => i.id === "missing-12vhpwr");
    expect(missing12v).toBeDefined();
    expect(missing12v!.severity).toBe("warning");
    expect(missing12v!.title).toContain("Adapter");
  });

  it("RTX 4090 (16-pin) + ATX 2.x PSU with only 1 8-pin → critical", () => {
    const gpu = gpu16pin("gpu-4090", "RTX 4090", 450, 600);
    const psu = psuAtx2xWithOne8pin();
    const issues = checkPowerConnectors(gpu, psu);
    expect(issues.length).toBeGreaterThanOrEqual(1);
    const missing12v = issues.find((i) => i.id === "missing-12vhpwr");
    expect(missing12v).toBeDefined();
    expect(missing12v!.severity).toBe("critical");
  });

  it("RTX 3080 (2x 8-pin) + PSU with only 1 8-pin → critical", () => {
    const gpu = gpu2x8("gpu-3080", "RTX 3080");
    const psu = psuAtx2xWithOne8pin();
    const issues = checkPowerConnectors(gpu, psu);
    expect(issues.length).toBeGreaterThanOrEqual(1);
    const insufficient8 = issues.find((i) => i.id === "insufficient-8pin");
    expect(insufficient8).toBeDefined();
    expect(insufficient8!.severity).toBe("critical");
  });

  it("high transient GPU with adapter → adapter-transient-risk warning", () => {
    const gpu = gpu16pin("gpu-4090", "RTX 4090", 450, 600);
    const psu = psuAtx2xWithFour8pin();
    const issues = checkPowerConnectors(gpu, psu);
    const transient = issues.find((i) => i.id === "adapter-transient-risk");
    expect(transient).toBeDefined();
    expect(transient!.severity).toBe("warning");
  });

  it("no GPU or no PSU → no issues", () => {
    expect(checkPowerConnectors(undefined, psuAtx30With16pin())).toHaveLength(0);
    expect(checkPowerConnectors(gpu16pin("g", "G", 320), undefined)).toHaveLength(0);
  });
});

describe("checkAtxStandard", () => {
  it("16-pin GPU + ATX 2.x PSU without 12VHPWR → info note", () => {
    const gpu = gpu16pin("gpu-4080", "RTX 4080", 320);
    const psu = psuAtx2xWithFour8pin();
    const issue = checkAtxStandard(gpu, psu);
    expect(issue).not.toBeNull();
    expect(issue!.id).toBe("atx-2-with-modern-gpu");
    expect(issue!.severity).toBe("info");
  });

  it("16-pin GPU + ATX 3.0 PSU with native 12VHPWR → no issue", () => {
    const gpu = gpu16pin("gpu-4080", "RTX 4080", 320);
    const psu = psuAtx30With16pin();
    expect(checkAtxStandard(gpu, psu)).toBeNull();
  });

  it("2x 8-pin GPU + ATX 2.x → no ATX standard issue", () => {
    const gpu = gpu2x8("gpu-3080", "RTX 3080");
    const psu = psuAtx2xWithFour8pin();
    expect(checkAtxStandard(gpu, psu)).toBeNull();
  });
});
