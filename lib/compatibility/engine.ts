/**
 * Main compatibility checker engine
 */

import type { BuildInput } from "./types";
import type { Issue } from "./types";
import { estimateLoad } from "./power";
import {
  socketMismatch,
  ramTypeMismatch,
  formFactorIncompatible,
  gpuTooLong,
  coolerTooTall,
  psuTooLong,
  insufficientPsuConnectors,
  insufficientPower,
  noM2Slots,
  lowPsuHeadroom,
  biosUpdateNeeded,
  gpuThicknessRisk,
  ramSpeedRisk,
  radiatorConflict,
  noUpgradeRoom,
} from "./rules";
import type { RuleContext } from "./rules";

export interface CheckOptions {
  /** Optional PSU PCIe connector count (overrides wattage inference) */
  psuPcieConnectors?: number;
  /** Optional PSU length in mm */
  psuLengthMm?: number;
  /** Number of manual overrides used (reduces confidence) */
  manualOverrideCount?: number;
}

/**
 * Calculate confidence score (0-100) based on data completeness
 */
function calculateConfidence(
  build: BuildInput,
  options?: CheckOptions
): number {
  let confidence = 100;

  // -10 for each missing case clearance spec
  if (build.case) {
    if (build.case.specs.max_gpu_length_mm == null) confidence -= 10;
    if (build.case.specs.max_cooler_height_mm == null) confidence -= 10;
    if (build.case.specs.max_psu_length_mm == null) confidence -= 10;
  }

  // -15 if GPU thickness unknown
  if (build.gpu && build.gpu.specs.thickness_slots == null) {
    confidence -= 15;
  }

  // -10 if PSU connector data incomplete (we're inferring)
  if (build.psu && options?.psuPcieConnectors == null) {
    confidence -= 10;
  }

  // -5 per manual override used
  const overrideCount = options?.manualOverrideCount ?? 0;
  confidence -= overrideCount * 5;

  return Math.max(0, Math.min(100, confidence));
}

/**
 * Check build compatibility and return structured result
 */
export function checkCompatibility(
  build: BuildInput,
  options?: CheckOptions
): import("./types").CompatibilityResult {
  const hardFails: Issue[] = [];
  const warnings: Issue[] = [];
  const notes: Issue[] = [];

  const ctx: RuleContext = {
    psuPcieConnectors: options?.psuPcieConnectors,
    psuLengthMm: options?.psuLengthMm,
  };

  const storage = build.storage ?? [];
  const load = estimateLoad({
    cpu: build.cpu,
    gpu: build.gpu,
    ram: build.ram,
    storage,
  });

  // ----- Hard Fails -----

  if (build.cpu && build.motherboard) {
    const r = socketMismatch(build.cpu, build.motherboard);
    if (r) hardFails.push(r);
  }

  if (build.ram && build.motherboard) {
    const r = ramTypeMismatch(build.ram, build.motherboard);
    if (r) hardFails.push(r);
  }

  if (build.motherboard && build.case) {
    const r = formFactorIncompatible(build.motherboard, build.case);
    if (r) hardFails.push(r);
  }

  if (build.gpu && build.case) {
    const r = gpuTooLong(build.gpu, build.case);
    if (r) hardFails.push(r);
  }

  if (build.cooler && build.case) {
    const r = coolerTooTall(build.cooler, build.case);
    if (r) hardFails.push(r);
  }

  if (build.psu && build.case) {
    const r = psuTooLong(build.psu, build.case, ctx);
    if (r) hardFails.push(r);
  }

  if (build.gpu && build.psu) {
    const r = insufficientPsuConnectors(build.gpu, build.psu, ctx);
    if (r) hardFails.push(r);
  }

  if (build.psu) {
    const r = insufficientPower(build.psu, load);
    if (r) hardFails.push(r);
  }

  if (build.motherboard && storage.length > 0) {
    const r = noM2Slots(storage, build.motherboard);
    if (r) hardFails.push(r);
  }

  // ----- Warnings -----

  if (build.psu && load > 0) {
    const r = lowPsuHeadroom(build.psu, load);
    if (r) warnings.push(r);
  }

  if (build.cpu && build.motherboard) {
    const r = biosUpdateNeeded(build.cpu, build.motherboard);
    if (r) warnings.push(r);
  }

  if (build.gpu && build.case) {
    const r = gpuThicknessRisk(build.gpu, build.case);
    if (r) warnings.push(r);
  }

  if (build.ram && build.cpu) {
    const r = ramSpeedRisk(build.ram, build.cpu);
    if (r) warnings.push(r);
  }

  if (build.cooler && build.case) {
    const r = radiatorConflict(build.cooler, build.case);
    if (r) warnings.push(r);
  }

  if (build.motherboard) {
    const r = noUpgradeRoom(build.motherboard, build.ram, storage);
    if (r) notes.push(r);
  }

  const confidence = calculateConfidence(build, options);

  return {
    isCompatible: hardFails.length === 0,
    hardFails,
    warnings,
    notes,
    confidence,
  };
}
