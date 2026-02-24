/**
 * Individual compatibility rule functions
 * Each rule returns an Issue or null if the rule passes
 */

import type { CPU, GPU, Motherboard, RAM, Storage, PSU, Cooler, Case } from "@/types/components";
import type { FormFactor } from "@/types/components";
import type { Issue, IssueEvidence } from "./types";

// ============ Helpers ============

function createIssue(
  id: string,
  severity: Issue["severity"],
  title: string,
  description: string,
  affectedParts: string[],
  suggestedFixes?: string[],
  evidence?: IssueEvidence
): Issue {
  return { id, category: "compatibility", severity, title, description, affectedParts, suggestedFixes, evidence };
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
    const cpuSocket = cpu.specs.socket;
    const mbSocket = motherboard.specs.socket;
    return createIssue(
      "socketMismatch",
      "critical",
      "Socket mismatch",
      `CPU socket (${cpuSocket}) does not match motherboard socket (${mbSocket}).`,
      [cpu.id, motherboard.id],
      ["Select a CPU with the correct socket for your motherboard."],
      {
        values: {
          "CPU socket": cpuSocket,
          "Motherboard socket": mbSocket,
        },
        comparison: `${cpuSocket} ≠ ${mbSocket}`,
      }
    );
  }
  return null;
}

export function ramTypeMismatch(ram: RAM, motherboard: Motherboard): Issue | null {
  if (ram.specs.memory_type !== motherboard.specs.memory_type) {
    const ramType = ram.specs.memory_type;
    const mbType = motherboard.specs.memory_type;
    return createIssue(
      "ramTypeMismatch",
      "critical",
      "RAM type mismatch",
      `RAM is ${ramType} but motherboard supports ${mbType}.`,
      [ram.id, motherboard.id],
      ["Select RAM that matches the motherboard's memory type."],
      {
        values: {
          "RAM type": ramType,
          "Motherboard supports": mbType,
        },
        comparison: `${ramType} ≠ ${mbType}`,
      }
    );
  }
  return null;
}

export function formFactorIncompatible(
  motherboard: Motherboard,
  pcCase: Case
): Issue | null {
  const supported = FORM_FACTOR_HIERARCHY[pcCase.specs.form_factor];
  const mbFF = motherboard.specs.form_factor;
  const caseFF = pcCase.specs.form_factor;
  if (!supported?.includes(mbFF)) {
    return createIssue(
      "formFactorIncompatible",
      "critical",
      "Form factor incompatible",
      `Motherboard (${mbFF}) does not fit in case (${caseFF}).`,
      [motherboard.id, pcCase.id],
      ["Select a motherboard that fits the case form factor."],
      {
        values: {
          "Motherboard form factor": mbFF,
          "Case form factor": caseFF,
          "Case supports": supported?.join(", ") ?? "—",
        },
        comparison: `${mbFF} not supported by ${caseFF} case`,
      }
    );
  }
  return null;
}

/** GPU thickness (slots) exceeds case max — hard fail when case specifies limit */
export function gpuTooThick(gpu: GPU, pcCase: Case): Issue | null {
  const caseMaxSlots = pcCase.specs.max_gpu_thickness_slots;
  if (caseMaxSlots == null) return null;
  const gpuSlots = gpu.specs.thickness_slots;
  if (gpuSlots > caseMaxSlots) {
    return createIssue(
      "gpuTooThick",
      "critical",
      "GPU too thick for case",
      `GPU is ${gpuSlots} slots thick but case supports up to ${caseMaxSlots} slot(s).`,
      [gpu.id, pcCase.id],
      [
        "Choose a thinner GPU (fewer slots) or a case with more expansion clearance.",
      ],
      {
        values: {
          "GPU thickness": `${gpuSlots} slots`,
          "Case max thickness": `${caseMaxSlots} slots`,
          "Over by": `${gpuSlots - caseMaxSlots} slot(s)`,
        },
        comparison: `${gpuSlots} slots > ${caseMaxSlots} slots`,
      }
    );
  }
  return null;
}

export function gpuTooLong(gpu: GPU, pcCase: Case): Issue | null {
  const gpuLength = gpu.specs.length_mm;
  const caseMaxLength = pcCase.specs.max_gpu_length_mm;
  if (gpuLength > caseMaxLength) {
    const over = gpuLength - caseMaxLength;
    return createIssue(
      "gpuTooLong",
      "critical",
      "GPU too long for case",
      `GPU length (${gpuLength}mm) exceeds case maximum (${caseMaxLength}mm).`,
      [gpu.id, pcCase.id],
      [
        `Choose a GPU shorter than ${caseMaxLength}mm`,
        `Choose a larger case that supports ${gpuLength}mm+ GPUs`,
      ],
      {
        values: {
          "GPU length": `${gpuLength}mm`,
          "Case max GPU length": `${caseMaxLength}mm`,
          "Clearance needed": `${over}mm more`,
        },
        comparison: `${gpuLength}mm > ${caseMaxLength}mm`,
        calculation: `GPU (${gpuLength}mm) exceeds case clearance by ${over}mm`,
      }
    );
  }
  return null;
}

export function coolerTooTall(cooler: Cooler, pcCase: Case): Issue | null {
  const height = cooler.specs.height_mm;
  const caseMax = pcCase.specs.max_cooler_height_mm;
  if (cooler.specs.type === "Air" && height != null && caseMax != null) {
    if (height > caseMax) {
      const over = height - caseMax;
      return createIssue(
        "coolerTooTall",
        "critical",
        "Cooler too tall for case",
        `Cooler height (${height}mm) exceeds case maximum (${caseMax}mm).`,
        [cooler.id, pcCase.id],
        [
          `Choose a cooler shorter than ${caseMax}mm`,
          `Choose a case with cooler height ${height}mm+`,
        ],
        {
          values: {
            "Cooler height": `${height}mm`,
            "Case max cooler height": `${caseMax}mm`,
            "Over by": `${over}mm`,
          },
          comparison: `${height}mm > ${caseMax}mm`,
          calculation: `Cooler (${height}mm) exceeds case clearance by ${over}mm`,
        }
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
  const psuLength =
    ctx?.psuLengthMm ??
    psu.specs.length_mm ??
    (psu.specs.form_factor === "ATX" ? 160 : 130);
  const maxLength = pcCase.specs.max_psu_length_mm;
  if (maxLength != null && psuLength > maxLength) {
    const over = psuLength - maxLength;
    return createIssue(
      "psuTooLong",
      "critical",
      "PSU too long for case",
      `PSU length (~${psuLength}mm) exceeds case maximum (${maxLength}mm).`,
      [psu.id, pcCase.id],
      ["Select a shorter PSU or a case with more clearance."],
      {
        values: {
          "PSU length (est.)": `${psuLength}mm`,
          "Case max PSU length": `${maxLength}mm`,
          "Over by": `${over}mm`,
        },
        comparison: `${psuLength}mm > ${maxLength}mm`,
      }
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
    const connectors = gpu.specs.power_connectors?.join(", ") ?? "—";
    return createIssue(
      "insufficientPsuConnectors",
      "critical",
      "Insufficient PSU power connectors",
      `GPU requires ${demand} PCIe power connector(s) but PSU provides ~${available}.`,
      [gpu.id, psu.id],
      ["Select a PSU with more PCIe power connectors."],
      {
        values: {
          "GPU power connectors": connectors,
          "GPU demand (8-pin equiv.)": demand,
          "PSU provides (8-pin equiv.)": available,
          "Shortfall": (demand - available).toFixed(1),
        },
        comparison: `${demand} required > ${available} available`,
      }
    );
  }
  return null;
}

export function insufficientPower(psu: PSU, estimatedLoad: number): Issue | null {
  const load = Math.round(estimatedLoad);
  const psuW = psu.specs.wattage_w;
  const minRequired = Math.ceil(estimatedLoad * 1.05);
  if (psuW < minRequired) {
    return createIssue(
      "insufficientPower",
      "critical",
      "Insufficient PSU wattage",
      `Estimated load (~${load}W) exceeds PSU capacity (${psuW}W). Recommend at least ${minRequired}W.`,
      [psu.id],
      ["Select a higher wattage PSU."],
      {
        values: {
          "Estimated load": `${load}W`,
          "PSU wattage": `${psuW}W`,
          "Minimum recommended": `${minRequired}W`,
          "Shortfall": `${minRequired - psuW}W`,
        },
        comparison: `${load}W load > ${psuW}W PSU`,
        calculation: `Load (${load}W) × 1.05 headroom = ${minRequired}W minimum`,
      }
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
    const need = nvmeDrives.length;
    return createIssue(
      "noM2Slots",
      "critical",
      "Not enough M.2 slots",
      `You have ${need} NVMe drive(s) but motherboard has ${m2Slots} M.2 slot(s).`,
      [motherboard.id, ...nvmeDrives.map((s) => s.id)],
      ["Use fewer NVMe drives, or select a motherboard with more M.2 slots."],
      {
        values: {
          "NVMe drives": need,
          "M.2 slots on motherboard": m2Slots,
          "Slots needed": need - m2Slots > 0 ? `${need - m2Slots} more` : "—",
        },
        comparison: `${need} drives > ${m2Slots} slots`,
      }
    );
  }
  return null;
}

// ============ Warning Rules ============

export function lowPsuHeadroom(psu: PSU, estimatedLoad: number): Issue | null {
  const load = Math.round(estimatedLoad);
  const psuW = psu.specs.wattage_w;
  const headroom = psuW / estimatedLoad;
  const headroomPct = (headroom * 100).toFixed(0);
  if (estimatedLoad > 0 && headroom < 1.25) {
    return createIssue(
      "lowPsuHeadroom",
      "warning",
      "Low PSU headroom",
      `PSU headroom (${headroomPct}%) is below recommended 125%. System may be unstable under peak loads.`,
      [psu.id],
      ["Consider a higher wattage PSU for headroom (30%+ recommended)."],
      {
        values: {
          "Estimated load": `${load}W`,
          "PSU wattage": `${psuW}W`,
          "Headroom": `${headroomPct}%`,
          "Recommended": "125%+ (30%+ preferred)",
        },
        comparison: `${headroomPct}% < 125% recommended`,
        calculation: `(${psuW}W / ${load}W) = ${headroom.toFixed(2)} (${headroomPct}%)`,
      }
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
  const chipset = motherboard.specs.chipset ?? "—";
  const chipsetNorm = chipset.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const mayNeedUpdate = CHIPSETS_MAY_NEED_UPDATE.some(
    (c) => chipsetNorm.includes(c.toUpperCase().replace(/[^A-Z0-9]/g, ""))
  );
  if (mayNeedUpdate && !motherboard.specs.has_bios_flashback) {
    return createIssue(
      "biosUpdateNeeded",
      "warning",
      "BIOS update may be required",
      "This CPU may require a BIOS update to work with the motherboard. Without BIOS flashback, you'd need an older CPU to update.",
      [cpu.id, motherboard.id],
      ["Verify compatibility or choose a motherboard with BIOS flashback."],
      {
        values: {
          "CPU": cpu.name,
          "Motherboard chipset": chipset,
          "BIOS flashback": motherboard.specs.has_bios_flashback ? "Yes" : "No",
        },
        comparison: "Chipset may need BIOS update for this CPU",
      }
    );
  }
  return null;
}

export function gpuThicknessRisk(gpu: GPU, pcCase: Case): Issue | null {
  const slots = gpu.specs.thickness_slots;
  if (slots > 2.5) {
    return createIssue(
      "gpuThicknessRisk",
      "warning",
      "GPU thickness may cause clearance issues",
      `GPU is ${slots} slots thick. Verify case has adequate expansion slot clearance.`,
      [gpu.id, pcCase.id],
      ["Check case specifications for multi-slot GPU clearance."],
      {
        values: {
          "GPU thickness": `${slots} slots`,
          "Typical limit": "2.5 slots",
        },
        comparison: `${slots} slots > 2.5 slots (verify case supports)`,
      }
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
      `RAM runs at ${ramSpeed}MHz but CPU supports up to ${maxSpeed}MHz. RAM may run at JEDEC until XMP/EXPO enabled.`,
      [ram.id, cpu.id],
      ["Enable XMP (Intel) or EXPO (AMD) in BIOS to run at full speed."],
      {
        values: {
          "RAM speed": `${ramSpeed}MHz`,
          "CPU max memory speed": `${maxSpeed}MHz`,
          "Over spec by": `${ramSpeed - maxSpeed}MHz`,
        },
        comparison: `${ramSpeed}MHz > ${maxSpeed}MHz (CPU max)`,
      }
    );
  }
  return null;
}

/** AIO radiator size not in case supported list — hard fail */
export function radiatorNotSupported(cooler: Cooler, pcCase: Case): Issue | null {
  if (cooler.specs.type !== "AIO" || cooler.specs.radiator_size_mm == null)
    return null;
  const supported = pcCase.specs.supports_radiator_mm;
  if (supported == null || !Array.isArray(supported) || supported.length === 0)
    return null;
  const rad = cooler.specs.radiator_size_mm;
  if (supported.includes(rad)) return null;
  const supportedStr = supported.join(", ");
  return createIssue(
    "radiatorNotSupported",
    "critical",
    "AIO radiator not supported by case",
    `Case supports radiator sizes ${supportedStr}mm but cooler has ${rad}mm radiator.`,
    [cooler.id, pcCase.id],
    [
      "Choose an AIO that matches case radiator support, or a case that supports this radiator size.",
    ],
    {
      values: {
        "Radiator size": `${rad}mm`,
        "Case supports": supportedStr + " mm",
      },
      comparison: `${rad}mm not in [${supportedStr}]`,
    }
  );
}

/** Radiator + fan thickness exceeds case clearance */
export function radiatorTooThick(cooler: Cooler, pcCase: Case): Issue | null {
  if (cooler.specs.type !== "AIO") return null;
  const caseMax = pcCase.specs.max_radiator_thickness_mm;
  const coolerThickness = cooler.specs.radiator_fan_thickness_mm;
  if (caseMax == null || coolerThickness == null) return null;
  if (coolerThickness <= caseMax) return null;
  const over = coolerThickness - caseMax;
  return createIssue(
    "radiatorTooThick",
    "critical",
    "AIO radiator too thick for case",
    `Radiator + fan thickness (${coolerThickness}mm) exceeds case clearance (${caseMax}mm).`,
    [cooler.id, pcCase.id],
    [
      "Choose a slimmer AIO or a case with more radiator clearance.",
    ],
    {
      values: {
        "Radiator + fan thickness": `${coolerThickness}mm`,
        "Case max clearance": `${caseMax}mm`,
        "Over by": `${over}mm`,
      },
      comparison: `${coolerThickness}mm > ${caseMax}mm`,
    }
  );
}

export function radiatorConflict(cooler: Cooler, pcCase: Case): Issue | null {
  if (cooler.specs.type === "AIO" && cooler.specs.radiator_size_mm) {
    const rad = cooler.specs.radiator_size_mm;
    const caseGpuMax = pcCase.specs.max_gpu_length_mm;
    if (rad >= 280) {
      return createIssue(
        "radiatorConflict",
        "warning",
        "AIO radiator may reduce GPU clearance",
        `Front-mounting a ${rad}mm radiator can reduce available GPU length. May also affect RAM/VRM clearance with top mount.`,
        [cooler.id, pcCase.id],
        ["Consider top-mounting the radiator if possible; verify RAM and VRM clearance."],
        {
          values: {
            "Radiator size": `${rad}mm`,
            "Case GPU max (no rad)": caseGpuMax != null ? `${caseGpuMax}mm` : "—",
            "Note": "Front rad reduces GPU clearance; top rad may conflict with tall RAM/VRM",
          },
          comparison: `${rad}mm rad may reduce GPU clearance`,
        }
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
  const ramSlots = motherboard.specs.ram_slots;
  const m2Slots = motherboard.specs.m2_slots ?? 0;
  const ramFilled = ram && ram.specs.modules >= ramSlots;
  const nvmeCount = storage?.filter((s) => s.specs.interface === "NVMe").length ?? 0;
  const m2Filled = m2Slots > 0 && nvmeCount >= m2Slots;
  if (ramFilled) issues.push("All RAM slots are filled.");
  if (m2Filled) issues.push("All M.2 slots are used.");
  if (issues.length > 0) {
    const values: Record<string, string | number> = {
      "RAM slots": ramSlots,
      "RAM slots used": ram?.specs.modules ?? 0,
      "M.2 slots": m2Slots,
      "M.2 slots used": nvmeCount,
    };
    return createIssue(
      "noUpgradeRoom",
      "info",
      "Limited upgrade room",
      issues.join(" ") + " Consider future expansion when selecting parts.",
      [motherboard.id],
      undefined,
      {
        values,
        comparison: "No free RAM or M.2 slots for future upgrades",
      }
    );
  }
  return null;
}
