"use client";

import type { PartCategory } from "@/lib/store/types";

interface SpecificationTableProps {
  specs: Record<string, unknown>;
  category: PartCategory;
}

const SPEC_ORDER: Record<PartCategory, string[]> = {
  cpu: [
    "brand",
    "socket",
    "cores",
    "threads",
    "base_clock_ghz",
    "boost_clock_ghz",
    "tdp_w",
    "max_mem_speed_mhz",
    "memory_type",
    "pcie_version",
    "has_igpu",
    "tier",
    "supports_ecc",
  ],
  gpu: [
    "brand",
    "vram_gb",
    "length_mm",
    "thickness_slots",
    "tdp_w",
    "power_connectors",
    "pcie_version",
    "tier",
    "peak_power_w",
  ],
  motherboard: [
    "socket",
    "chipset",
    "form_factor",
    "memory_type",
    "ram_slots",
    "max_ram_gb",
    "m2_slots",
    "sata_ports",
    "pcie_version",
    "has_bios_flashback",
    "max_memory_speed_stock_mhz",
    "max_memory_speed_oc_mhz",
    "supports_xmp",
    "supports_expo",
    "supports_ecc",
  ],
  ram: [
    "memory_type",
    "capacity_gb",
    "modules",
    "speed_mhz",
    "latency",
    "voltage_v",
    "is_ecc",
    "is_registered",
  ],
  storage: [
    "interface",
    "form_factor",
    "capacity_gb",
    "read_speed_mb_s",
    "write_speed_mb_s",
    "tbw",
    "physical_size",
  ],
  psu: [
    "wattage_w",
    "efficiency",
    "form_factor",
    "modular",
    "atx_standard",
    "pcie_5_ready",
    "length_mm",
  ],
  cooler: [
    "type",
    "height_mm",
    "radiator_size_mm",
    "tdp_rating_w",
    "sockets",
    "fan_count",
    "rgb_type",
  ],
  case: [
    "form_factor",
    "max_gpu_length_mm",
    "max_cooler_height_mm",
    "max_psu_length_mm",
    "max_gpu_thickness_slots",
    "drive_bays_2_5",
    "drive_bays_3_5",
    "expansion_slots",
    "max_psu_form_factor",
    "preinstalled_fans",
    "max_fans",
  ],
};

const SPEC_LABELS: Record<string, string> = {
  tdp_w: "TDP",
  base_clock_ghz: "Base Clock",
  boost_clock_ghz: "Boost Clock",
  max_mem_speed_mhz: "Max Memory Speed (MHz)",
  has_igpu: "Integrated Graphics",
  vram_gb: "VRAM",
  length_mm: "Length (mm)",
  thickness_slots: "Thickness (slots)",
  power_connectors: "Power Connectors",
  pcie_version: "PCIe Version",
  peak_power_w: "Peak Power (W)",
  ram_slots: "RAM Slots",
  max_ram_gb: "Max RAM (GB)",
  m2_slots: "M.2 Slots",
  sata_ports: "SATA Ports",
  has_bios_flashback: "BIOS Flashback",
  max_memory_speed_stock_mhz: "Max Memory (JEDEC)",
  max_memory_speed_oc_mhz: "Max Memory (XMP/EXPO)",
  supports_xmp: "XMP Support",
  supports_expo: "EXPO Support",
  supports_ecc: "ECC Support",
  speed_mhz: "Speed (MHz)",
  voltage_v: "Voltage (V)",
  is_ecc: "ECC",
  is_registered: "Registered",
  read_speed_mb_s: "Read (MB/s)",
  write_speed_mb_s: "Write (MB/s)",
  wattage_w: "Wattage",
  efficiency_rating: "Efficiency",
  atx_standard: "ATX Standard",
  pcie_5_ready: "PCIe 5.0 Ready",
  tdp_rating_w: "TDP Rating",
  radiator_size_mm: "Radiator (mm)",
  fan_count: "Fans",
  rgb_type: "RGB",
  max_gpu_length_mm: "Max GPU Length (mm)",
  max_cooler_height_mm: "Max Cooler Height (mm)",
  max_psu_length_mm: "Max PSU Length (mm)",
  max_gpu_thickness_slots: "Max GPU Thickness",
  drive_bays_2_5: "2.5\" Bays",
  drive_bays_3_5: "3.5\" Bays",
  max_psu_form_factor: "PSU Form Factor",
  preinstalled_fans: "Preinstalled Fans",
  max_fans: "Max Fans",
};

function formatValue(key: string, value: unknown): string {
  if (value === undefined || value === null) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") {
    if (key === "power_connectors" && Array.isArray(value)) return (value as string[]).join(", ");
    return Object.entries(value)
      .map(([k, v]) => `${v}× ${k.replace(/_/g, " ")}`)
      .join(", ");
  }
  return String(value);
}

function formatLabel(key: string): string {
  return (
    SPEC_LABELS[key] ??
    key
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  );
}

export function SpecificationTable({ specs, category }: SpecificationTableProps) {
  const order = SPEC_ORDER[category] ?? Object.keys(specs);

  return (
    <div className="space-y-0">
      {order.map((key) => {
        const value = specs[key];
        if (value === undefined || value === null) return null;
        if (typeof value === "object" && !Array.isArray(value) && key === "headers") return null;
        if (typeof value === "object" && !Array.isArray(value) && key === "front_panel") return null;

        return (
          <div
            key={key}
            className="flex justify-between gap-4 py-2 border-b border-zinc-200 last:border-0 dark:border-zinc-700"
          >
            <span className="shrink-0 text-sm text-zinc-500 dark:text-zinc-400">
              {formatLabel(key)}:
            </span>
            <span className="min-w-0 text-right text-sm font-medium text-foreground break-words">
              {formatValue(key, value)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
