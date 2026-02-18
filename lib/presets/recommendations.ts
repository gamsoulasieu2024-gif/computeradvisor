/**
 * Preset-based part filtering and recommendations
 */

import type { BuildPreset } from "@/lib/store/types";
import type { CPU, GPU, Motherboard, RAM, Storage, PSU, Cooler, Case } from "@/types/components";
import { getPresetDefinition } from "./definitions";
import type { FormFactor } from "@/types/components";

export type PartType = "cpu" | "gpu" | "motherboard" | "ram" | "storage" | "psu" | "cooler" | "case";

interface Catalog {
  cpus: CPU[];
  gpus: GPU[];
  motherboards: Motherboard[];
  ram: RAM[];
  storage: Storage[];
  psus: PSU[];
  coolers: Cooler[];
  cases: Case[];
}

/** Filter parts by preset constraints */
export function filterByPreset(
  preset: BuildPreset,
  category: PartType,
  parts: unknown[],
  catalog?: Catalog
): unknown[] {
  const def = getPresetDefinition(preset);
  const specs = def.recommendedSpecs;

  if (preset === "custom") return parts;

  switch (category) {
    case "cpu": {
      const cpuParts = parts as CPU[];
      return cpuParts.filter((p) => {
        const tier = p.specs?.tier ?? 0;
        const cores = p.specs?.cores ?? 0;
        const tdp = p.specs?.tdp_w ?? 0;
        if (specs.cpuTierMin != null && tier < specs.cpuTierMin) return false;
        if (specs.cpuTierMax != null && tier > specs.cpuTierMax) return false;
        if (specs.cpuCoresMin != null && cores < specs.cpuCoresMin) return false;
        if (specs.maxTdpTarget != null && tdp > specs.maxTdpTarget) return false;
        return true;
      });
    }
    case "gpu": {
      const gpuParts = parts as GPU[];
      return gpuParts.filter((p) => {
        const tier = p.specs?.tier ?? 0;
        const length = p.specs?.length_mm ?? 0;
        if (specs.gpuTierMin != null && tier < specs.gpuTierMin) return false;
        if (specs.gpuTierMax != null && tier > specs.gpuTierMax) return false;
        if (specs.maxGpuLengthMm != null && length > specs.maxGpuLengthMm) return false;
        return true;
      });
    }
    case "motherboard": {
      const mbParts = parts as Motherboard[];
      if (!specs.formFactors?.length) return mbParts;
      return mbParts.filter((p) =>
        specs.formFactors!.includes(p.specs?.form_factor as FormFactor)
      );
    }
    case "ram": {
      const ramParts = parts as RAM[];
      if (specs.ramGbMin == null) return ramParts;
      return ramParts.filter((p) => {
        const cap = p.specs?.capacity_gb ?? 0;
        const modules = p.specs?.modules ?? 1;
        return cap * modules >= specs.ramGbMin!;
      });
    }
    case "storage": {
      const storageParts = parts as Storage[];
      return storageParts.filter((p) => {
        const cap = p.specs?.capacity_gb ?? 0;
        const iface = p.specs?.interface;
        if (specs.storageGbMin != null && cap < specs.storageGbMin) return false;
        if (specs.storageInterface && iface !== specs.storageInterface) return false;
        return true;
      });
    }
    case "case": {
      if (!specs.formFactors?.length && !specs.maxGpuLengthMm) return parts;
      const caseParts = parts as Case[];
      return caseParts.filter((p) => {
        const ff = p.specs?.form_factor as FormFactor;
        const maxGpu = p.specs?.max_gpu_length_mm;
        if (specs.formFactors?.length && !specs.formFactors.includes(ff)) return false;
        if (specs.maxGpuLengthMm != null && (maxGpu ?? 0) < specs.maxGpuLengthMm) return false;
        return true;
      });
    }
    default:
      return parts;
  }
}

/** Score a part's match to preset (higher = better) */
export function scorePartForPreset(
  preset: BuildPreset,
  category: PartType,
  part: unknown
): number {
  const def = getPresetDefinition(preset);
  const specs = def.recommendedSpecs;
  let score = 100;

  const p = part as Record<string, unknown>;
  const s = (p.specs ?? {}) as Record<string, unknown>;

  if (category === "cpu") {
    const tier = (s.tier as number) ?? 0;
    if (specs.cpuTierMin != null && tier < specs.cpuTierMin) score -= 30;
    if (specs.cpuTierMin != null && tier >= specs.cpuTierMin) score += 10;
    if (specs.cpuCoresMin != null) {
      const cores = (s.cores as number) ?? 0;
      if (cores >= specs.cpuCoresMin) score += 15;
    }
  }
  if (category === "gpu") {
    const tier = (s.tier as number) ?? 0;
    if (specs.gpuTierMin != null && tier >= specs.gpuTierMin) score += 10;
  }
  if (category === "ram" && specs.ramGbMin != null) {
    const cap = (s.capacity_gb as number) ?? 0;
    const mods = (s.modules as number) ?? 1;
    if (cap * mods >= specs.ramGbMin) score += 15;
  }
  return score;
}
