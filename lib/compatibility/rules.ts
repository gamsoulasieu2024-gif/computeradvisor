/**
 * Individual compatibility rule functions
 * Each rule returns an Issue or null if the rule passes
 */

import type { CPU, GPU, Motherboard, RAM, Storage, PSU, Cooler, Case } from "@/types/components";
import type { FormFactor } from "@/types/components";
import type { Issue } from "./types";
import { estimateLoad } from "./power";

// ============ Helpers ============

function createIssue(
  id: string,
  severity: Issue["severity"],
  title: string,
  description: string,
  affectedParts: string[],
  suggestedFixes?: string[]
): Issue {
  return { id, category: "compatibility", severity, title, description, affectedParts, suggestedFixes };
}

/** Derive supported form factors from case (larger cases support smaller boards) */
const FORM_FACTOR_HIERARCHY: Record<FormFactor, FormFactor[]> = {
  "E-ATX": ["E-ATX", "ATX", "Micro-ATX", "Mini-ITX"],
  ATX: ["ATX", "Micro-ATX", "Mini-ITX"],
  "Micro-ATX": ["Micro-ATX", "Mini-ITX"],
  "Mini-ITX": ["Mini-ITX"],
};

/** Infer PSU PCIe 8-pin equivalent count from wattage */
function inferPsuConnectors(wattage: number): number {
  if (wattage >= 1000) return 4;
  if (wattage >= 850) return 3;
  if (wattage >= 750) return 2;
  if (wattage >= 650) return 2;
  return 1;
}

/** GPU power connector demand (8-pin equivalent) */
function gpuConnectorDemand(connectors: string[]): number {
  return connectors.reduce((sum, c) => {
    if (c === "16-pin" || c === "12-pin") return sum + 2;
    if (c === "8-pin") return sum + 1;
    if (c === "6-pin") return sum + 0.5;
    return sum;
  }, 0);
}

// ============ Context for optional overrides ============

export interface RuleContext {
  /** Optional PSU PCIe 8-pin equivalent count (overrides wattage inference) */
  psuPcieConnectors?: number;
  /** Optional PSU length mm (overrides default) */
  psuLengthMm?: number;
  /** Manual overrides count for confidence */
  manualOverrideCount?: number;
}

// ============ Hard Fail Rules ============

export function socketMismatch(
  cpu: CPU,
  motherboard: Motherboard
): Issue | null {
  if (cpu.specs.socket !== motherboard.specs.socket) {
    return createIssue(
      "socketMismatch",
      "critical",
      "Socket mismatch",
      `CPU socket (${cpu.specs.socket}) does not match motherboard socket (${motherboard.specs.socket}).`,
      [cpu.id, motherboard.id],
      ["Select a CPU with the correct socket for your motherboard."]
    );
  }
  return null;
}

export function ramTypeMismatch(ram: RAM, motherboard: Motherboard): Issue | null {
  if (ram.specs.memory_type !== motherboard.specs.memory_type) {
    return createIssue(
      "ramTypeMismatch",
      "critical",
      "RAM type mismatch",
      `RAM is ${ram.specs.memory_type} but motherboard supports ${motherboard.specs.memory_type}.`,
      [ram.id, motherboard.id],
      ["Select RAM that matches the motherboard's memory type."]
    );
  }
  return null;
}

export function formFactorIncompatible(
  motherboard: Motherboard,
  pcCase: Case
): Issue | null {
  const supported = FORM_FACTOR_HIERARCHY[pcCase.specs.form_factor];
  if (!supported?.includes(motherboard.specs.form_factor)) {
    return createIssue(
      "formFactorIncompatible",
      "critical",
      "Form factor incompatible",
      `Motherboard (${motherboard.specs.form_factor}) does not fit in case (${pcCase.specs.form_factor}).`,
      [motherboard.id, pcCase.id],
      ["Select a motherboard that fits the case form factor."]
    );
  }
  return null;
}

export function gpuTooLong(gpu: GPU, pcCase: Case): Issue | null {
  if (gpu.specs.length_mm > pcCase.specs.max_gpu_length_mm) {
    return createIssue(
      "gpuTooLong",
      "critical",
      "GPU too long for case",
      `GPU length (${gpu.specs.length_mm}mm) exceeds case maximum (${pcCase.specs.max_gpu_length_mm}mm).`,
      [gpu.id, pcCase.id],
      ["Select a shorter GPU or a case with more clearance."]
    );
  }
  return null;
}

export function coolerTooTall(cooler: Cooler, pcCase: Case): Issue | null {
  const height = cooler.specs.height_mm;
  if (cooler.specs.type === "Air" && height != null) {
    if (height > pcCase.specs.max_cooler_height_mm) {
      return createIssue(
        "coolerTooTall",
        "critical",
        "Cooler too tall for case",
        `Cooler height (${height}mm) exceeds case maximum (${pcCase.specs.max_cooler_height_mm}mm).`,
        [cooler.id, pcCase.id],
        ["Select a shorter cooler or a case with more clearance."]
      );
    }
  }
  return null;
}

export function psuTooLong(
  psu: PSU,
  pcCase: Case,
  ctx?: RuleContext
): Issue | null {
  const psuLength = ctx?.psuLengthMm ?? (psu.specs.form_factor === "ATX" ? 160 : 130);
  const maxLength = pcCase.specs.max_psu_length_mm;
  if (maxLength != null && psuLength > maxLength) {
    return createIssue(
      "psuTooLong",
      "critical",
      "PSU too long for case",
      `PSU length (~${psuLength}mm) exceeds case maximum (${maxLength}mm).`,
      [psu.id, pcCase.id],
      ["Select a shorter PSU or a case with more clearance."]
    );
  }
  return null;
}

export function insufficientPsuConnectors(
  gpu: GPU,
  psu: PSU,
  ctx?: RuleContext
): Issue | null {
  const demand = gpuConnectorDemand(gpu.specs.power_connectors);
  const available = ctx?.psuPcieConnectors ?? inferPsuConnectors(psu.specs.wattage_w);
  if (demand > available) {
    return createIssue(
      "insufficientPsuConnectors",
      "critical",
      "Insufficient PSU power connectors",
      `GPU requires ${demand} PCIe power connector(s) but PSU provides ~${available}.`,
      [gpu.id, psu.id],
      ["Select a PSU with more PCIe power connectors."]
    );
  }
  return null;
}

export function insufficientPower(psu: PSU, estimatedLoad: number): Issue | null {
  const minRequired = estimatedLoad * 1.05;
  if (psu.specs.wattage_w < minRequired) {
    return createIssue(
      "insufficientPower",
      "critical",
      "Insufficient PSU wattage",
      `Estimated load (~${Math.round(estimatedLoad)}W) exceeds PSU capacity (${psu.specs.wattage_w}W). Recommend at least ${Math.ceil(minRequired)}W.`,
      [psu.id],
      ["Select a higher wattage PSU."]
    );
  }
  return null;
}

export function noM2Slots(
  storage: Storage[],
  motherboard: Motherboard
): Issue | null {
  const nvmeDrives = storage.filter((s) => s.specs.interface === "NVMe");
  if (nvmeDrives.length === 0) return null;
  const m2Slots = motherboard.specs.m2_slots ?? 0;
  if (m2Slots === 0 || nvmeDrives.length > m2Slots) {
    return createIssue(
      "noM2Slots",
      "critical",
      "Not enough M.2 slots",
      `You have ${nvmeDrives.length} NVMe drive(s) but motherboard has ${m2Slots} M.2 slot(s).`,
      [motherboard.id, ...nvmeDrives.map((s) => s.id)],
      ["Use fewer NVMe drives, or select a motherboard with more M.2 slots."]
    );
  }
  return null;
}

// ============ Warning Rules ============

export function lowPsuHeadroom(psu: PSU, estimatedLoad: number): Issue | null {
  const headroom = psu.specs.wattage_w / estimatedLoad;
  if (estimatedLoad > 0 && headroom < 1.25) {
    return createIssue(
      "lowPsuHeadroom",
      "warning",
      "Low PSU headroom",
      `PSU headroom (${(headroom * 100).toFixed(0)}%) is below recommended 125%. System may be unstable under peak loads.`,
      [psu.id],
      ["Consider a higher wattage PSU for headroom."]
    );
  }
  return null;
}

/** Chipsets that commonly need BIOS updates for newer CPUs */
const CHIPSETS_MAY_NEED_UPDATE = ["B450", "X470", "A520", "B550", "X570", "B650", "X670"];

export function biosUpdateNeeded(
  cpu: CPU,
  motherboard: Motherboard
): Issue | null {
  const chipset = motherboard.specs.chipset?.toUpperCase().replace(/[^A-Z0-9]/g, "") ?? "";
  const mayNeedUpdate = CHIPSETS_MAY_NEED_UPDATE.some(
    (c) => chipset.includes(c.toUpperCase().replace(/[^A-Z0-9]/g, ""))
  );
  if (mayNeedUpdate && !motherboard.specs.has_bios_flashback) {
    return createIssue(
      "biosUpdateNeeded",
      "warning",
      "BIOS update may be required",
      "This CPU may require a BIOS update to work with the motherboard. Without BIOS flashback, you'd need an older CPU to update.",
      [cpu.id, motherboard.id],
      ["Verify compatibility or choose a motherboard with BIOS flashback."]
    );
  }
  return null;
}

export function gpuThicknessRisk(gpu: GPU, pcCase: Case): Issue | null {
  if (gpu.specs.thickness_slots > 2.5) {
    return createIssue(
      "gpuThicknessRisk",
      "warning",
      "GPU thickness may cause clearance issues",
      `GPU is ${gpu.specs.thickness_slots} slots thick. Verify case has adequate expansion slot clearance.`,
      [gpu.id, pcCase.id],
      ["Check case specifications for multi-slot GPU clearance."]
    );
  }
  return null;
}

export function ramSpeedRisk(ram: RAM, cpu: CPU): Issue | null {
  const ramSpeed = ram.specs.speed_mhz;
  const maxSpeed = cpu.specs.max_mem_speed_mhz;
  if (ramSpeed > maxSpeed) {
    return createIssue(
      "ramSpeedRisk",
      "warning",
      "RAM speed exceeds CPU specification",
      `RAM runs at ${ramSpeed}MHz but CPU supports up to ${maxSpeed}MHz. Enable XMP/EXPO to run at full speed.`,
      [ram.id, cpu.id],
      ["Enable XMP (Intel) or EXPO (AMD) in BIOS."]
    );
  }
  return null;
}

export function radiatorConflict(cooler: Cooler, pcCase: Case): Issue | null {
  if (cooler.specs.type === "AIO" && cooler.specs.radiator_size_mm) {
    const rad = cooler.specs.radiator_size_mm;
    if (rad >= 280) {
      return createIssue(
        "radiatorConflict",
        "warning",
        "AIO radiator may reduce GPU clearance",
        `Front-mounting a ${rad}mm radiator can reduce available GPU length.`,
        [cooler.id, pcCase.id],
        ["Consider top-mounting the radiator if possible."]
      );
    }
  }
  return null;
}

export function noUpgradeRoom(
  motherboard: Motherboard,
  ram?: RAM,
  storage?: Storage[]
): Issue | null {
  const issues: string[] = [];
  if (ram && ram.specs.modules >= motherboard.specs.ram_slots) {
    issues.push("All RAM slots are filled.");
  }
  const nvmeCount = storage?.filter((s) => s.specs.interface === "NVMe").length ?? 0;
  if (nvmeCount >= motherboard.specs.m2_slots && motherboard.specs.m2_slots > 0) {
    issues.push("All M.2 slots are used.");
  }
  if (issues.length > 0) {
    return createIssue(
      "noUpgradeRoom",
      "info",
      "Limited upgrade room",
      issues.join(" ") + " Consider future expansion when selecting parts.",
      [motherboard.id],
      undefined
    );
  }
  return null;
}
