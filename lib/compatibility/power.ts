/**
 * PSU power estimation logic
 * Formula: estimatedLoad = cpu.tdp_w * 1.2 + gpu.tdp_w * 1.3 + 60 (base)
 */

import type { CPU, GPU, RAM, Storage } from "@/types/components";

const BASE_LOAD_W = 60;
const CPU_MULTIPLIER = 1.2;
const GPU_MULTIPLIER = 1.3;
const RAM_W_PER_8GB = 5;
const STORAGE_W_PER_DRIVE = 10;

/**
 * Calculate estimated system power draw in watts
 */
export function estimateLoad(params: {
  cpu?: CPU;
  gpu?: GPU;
  ram?: RAM;
  storage?: Storage[];
}): number {
  let total = BASE_LOAD_W;

  if (params.cpu?.specs?.tdp_w != null) {
    total += params.cpu.specs.tdp_w * CPU_MULTIPLIER;
  }

  if (params.gpu?.specs?.tdp_w != null) {
    total += params.gpu.specs.tdp_w * GPU_MULTIPLIER;
  }

  if (params.ram?.specs?.capacity_gb != null) {
    total += Math.ceil(params.ram.specs.capacity_gb / 8) * RAM_W_PER_8GB;
  }

  if (params.storage?.length) {
    total += params.storage.length * STORAGE_W_PER_DRIVE;
  }

  return Math.round(total);
}

/**
 * Calculate PSU headroom ratio (psu.wattage / estimatedLoad)
 */
export function getHeadroom(psuWattage: number, estimatedLoad: number): number {
  if (estimatedLoad <= 0) return Infinity;
  return psuWattage / estimatedLoad;
}
