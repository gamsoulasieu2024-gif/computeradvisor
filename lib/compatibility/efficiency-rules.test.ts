import { describe, it, expect } from "vitest";
import {
  checkCpuGpuBalance,
  checkPsuOverkill,
  checkRamSpeedValue,
  checkMotherboardValue,
  checkStorageValue,
} from "./efficiency-rules";
import type { CPU, GPU, RAM, PSU, Motherboard, Storage } from "@/types/components";

function cpuTier(tier: number, price = 0): CPU {
  return {
    id: "cpu",
    name: "Test CPU",
    manufacturer: "Intel",
    price_usd: price,
    specs: {
      brand: "Intel",
      socket: "LGA1700",
      cores: 8,
      threads: 16,
      base_clock_ghz: 3.5,
      boost_clock_ghz: 5.0,
      tdp_w: 125,
      max_mem_speed_mhz: 5600,
      memory_type: "DDR5",
      pcie_version: "5.0",
      has_igpu: true,
      tier,
    },
  };
}

function gpuTier(tier: number): GPU {
  return {
    id: "gpu",
    name: "Test GPU",
    manufacturer: "NVIDIA",
    specs: {
      brand: "NVIDIA",
      length_mm: 300,
      thickness_slots: 2,
      tdp_w: 200,
      power_connectors: ["8-pin", "8-pin"],
      pcie_version: "4.0",
      vram_gb: 8,
      tier,
    },
  };
}

describe("checkCpuGpuBalance", () => {
  it("i9-tier CPU + RTX 3060-tier GPU for gaming → CPU overkill warning", () => {
    const cpu = cpuTier(9, 500);
    const gpu = gpuTier(5); // tier diff = 4
    const issue = checkCpuGpuBalance(cpu, gpu, "gaming-1080p");
    expect(issue).not.toBeNull();
    expect(issue!.id).toBe("cpu-overkill-gaming");
    expect(issue!.severity).toBe("warning");
    expect(issue!.title).toContain("CPU Overkill");
  });

  it("balanced CPU/GPU for gaming → no issue", () => {
    const cpu = cpuTier(6);
    const gpu = gpuTier(6);
    expect(checkCpuGpuBalance(cpu, gpu, "gaming-1080p")).toBeNull();
  });

  it("high-end GPU + low CPU for gaming → CPU bottleneck warning", () => {
    const cpu = cpuTier(5);
    const gpu = gpuTier(9);
    const issue = checkCpuGpuBalance(cpu, gpu, "gaming-1080p");
    expect(issue).not.toBeNull();
    expect(issue!.id).toBe("cpu-bottleneck-gaming");
  });
});

describe("checkPsuOverkill", () => {
  it("1200W PSU with 400W load → excessive PSU warning", () => {
    const psu: PSU = {
      id: "psu",
      name: "1200W",
      manufacturer: "Corsair",
      specs: {
        wattage_w: 1200,
        efficiency: "80+ Gold",
        form_factor: "ATX",
        modular: "Fully modular",
        pcie_5_ready: false,
      },
    };
    const issue = checkPsuOverkill(psu, 400);
    expect(issue).not.toBeNull();
    expect(issue!.id).toBe("psu-excessive");
    expect(issue!.severity).toBe("info");
  });

  it("850W PSU with 500W load → no issue", () => {
    const psu: PSU = {
      id: "psu",
      name: "850W",
      manufacturer: "Corsair",
      specs: {
        wattage_w: 850,
        efficiency: "80+ Gold",
        form_factor: "ATX",
        modular: "Fully modular",
        pcie_5_ready: false,
      },
    };
    expect(checkPsuOverkill(psu, 500)).toBeNull();
  });
});

describe("checkRamSpeedValue", () => {
  it("DDR5-7200 + CPU max 5600 → RAM speed waste warning", () => {
    const ram: RAM = {
      id: "ram",
      name: "DDR5-7200",
      manufacturer: "G.Skill",
      specs: {
        memory_type: "DDR5",
        capacity_gb: 32,
        speed_mhz: 7200,
        modules: 2,
        latency: "CL34",
      },
    };
    const cpu = cpuTier(7);
    const issue = checkRamSpeedValue(ram, cpu, "gaming-1080p");
    expect(issue).not.toBeNull();
    expect(issue!.id).toBe("ram-speed-waste");
  });
});

describe("checkMotherboardValue", () => {
  it("Z790 board + i5-tier CPU → motherboard overkill tip", () => {
    const mobo: Motherboard = {
      id: "mobo",
      name: "Z790",
      manufacturer: "ASUS",
      price_usd: 300,
      specs: {
        socket: "LGA1700",
        chipset: "Z790",
        form_factor: "ATX",
        memory_type: "DDR5",
        ram_slots: 4,
        max_ram_gb: 128,
        m2_slots: 3,
        sata_ports: 4,
        pcie_version: "5.0",
        has_bios_flashback: true,
      },
    };
    const cpu = cpuTier(5);
    const issue = checkMotherboardValue(mobo, cpu, "gaming-1080p");
    expect(issue).not.toBeNull();
    expect(issue!.id).toBe("motherboard-overkill");
  });
});

describe("checkStorageValue", () => {
  it("PCIe 5.0 class SSD in gaming build → unnecessary speed tip", () => {
    const storage: Storage[] = [
      {
        id: "ssd",
        name: "PCIe 5.0 SSD",
        manufacturer: "Samsung",
        specs: {
          interface: "NVMe",
          form_factor: "M.2 2280",
          capacity_gb: 1000,
          read_speed_mb_s: 12000,
        },
      },
    ];
    const issue = checkStorageValue(storage, "gaming-1080p");
    expect(issue).not.toBeNull();
    expect(issue!.id).toBe("pcie5-gaming-waste");
  });

  it("2.5TB storage in budget build → excessive storage tip", () => {
    const storage: Storage[] = [
      {
        id: "ssd1",
        name: "1TB",
        manufacturer: "Samsung",
        specs: {
          interface: "NVMe",
          form_factor: "M.2 2280",
          capacity_gb: 1000,
        },
      },
      {
        id: "ssd2",
        name: "1.5TB",
        manufacturer: "WD",
        specs: {
          interface: "NVMe",
          form_factor: "M.2 2280",
          capacity_gb: 1500,
        },
      },
    ];
    const issue = checkStorageValue(storage, "budget");
    expect(issue).not.toBeNull();
    expect(issue!.id).toBe("storage-excessive-budget");
  });
});
