/**
 * Main compatibility checker engine
 */

import type { BuildInput } from "./types";
import type { Issue } from "./types";
import { estimateLoad } from "./power";
import { checkPowerConnectors, checkAtxStandard } from "./power-connectors";
import {
  checkCpuGpuBalance,
  checkPsuOverkill,
  checkRamSpeedValue,
  checkMotherboardValue,
  checkStorageValue,
} from "./efficiency-rules";
import {
  socketMismatch,
  ramTypeMismatch,
  formFactorIncompatible,
  gpuTooLong,
  gpuTooThick,
  coolerTooTall,
  psuTooLong,
  insufficientPsuConnectors,
  insufficientPower,
  noM2Slots,
  lowPsuHeadroom,
  biosUpdateNeeded,
  gpuThicknessRisk,
  ramSpeedRisk,
  radiatorNotSupported,
  radiatorTooThick,
  radiatorConflict,
  noUpgradeRoom,
} from "./rules";
import type { RuleContext } from "./rules";
import { checkFanHeaders, checkRgbHeaders, checkUsbCHeader } from "./header-rules";
import { checkECCSupport } from "./ecc-check";
import { check35DriveClearance } from "./drive-clearance";
import { checkCoolingAdequacy } from "./cooling-adequacy";

export interface CheckOptions {
  /** Optional PSU PCIe connector count (overrides wattage inference) */
  psuPcieConnectors?: number;
  /** Optional PSU length in mm */
  psuLengthMm?: number;
  /** Number of manual overrides used (reduces confidence) */
  manualOverrideCount?: number;
  /** Build preset for efficiency checks (e.g. "gaming-1080p", "creator", "budget") */
  preset?: string;
}

/**
 * Calculate confidence score (0-100) based on data completeness
 */
function calculateConfidence(
  build: BuildInput,
  options?: CheckOptions
): number {
  let confidence = 100;
  const parts = build;

  if (parts.case) {
    if (parts.case.specs.max_gpu_length_mm == null) confidence -= 10;
    if (parts.case.specs.max_cooler_height_mm == null) confidence -= 10;
    if (parts.case.specs.max_psu_length_mm == null) confidence -= 8;
    const caseSpecs = parts.case.specs as { max_gpu_thickness_slots?: number };
    if (caseSpecs.max_gpu_thickness_slots == null) confidence -= 8;
  }

  if (parts.gpu) {
    if (parts.gpu.specs.thickness_slots == null) confidence -= 10;
    const gpuSpecs = parts.gpu.specs as { length_mm?: number };
    if (gpuSpecs.length_mm == null) confidence -= 15;
  }

  if (parts.psu && options?.psuPcieConnectors == null) {
    confidence -= 12;
  }

  const coolerSpecs = parts.cooler?.specs as {
    type?: string;
    radiator_fan_thickness_mm?: number;
  } | undefined;
  const caseSpecs = parts.case?.specs as {
    supports_radiator_mm?: number[];
    max_radiator_thickness_mm?: number;
  } | undefined;
  if (
    coolerSpecs?.type === "AIO" &&
    parts.case &&
    (caseSpecs?.supports_radiator_mm == null ||
      (Array.isArray(caseSpecs.supports_radiator_mm) &&
        caseSpecs.supports_radiator_mm.length === 0))
  ) {
    confidence -= 15;
  }
  if (
    coolerSpecs?.type === "AIO" &&
    parts.case &&
    (caseSpecs?.max_radiator_thickness_mm == null ||
      coolerSpecs?.radiator_fan_thickness_mm == null)
  ) {
    confidence -= 5;
  }

  const overrideCount = options?.manualOverrideCount ?? 0;
  confidence -= Math.min(overrideCount * 5, 20);

  return Math.max(0, Math.min(100, confidence));
}

/**
 * Core compatibility checker. Evaluates a build and returns structured
 * hard fails, warnings, and notes. Use for pre-purchase validation.
 *
 * @param build - Build input (selected parts: cpu, motherboard, ram, gpu, psu, cooler, case, storage)
 * @param options - Optional overrides (PSU connector count, PSU length mm, manual override count)
 * @returns CompatibilityResult with isCompatible, hardFails, warnings, notes, confidence (0-100), checksRun
 */
export function checkCompatibility(
  build: BuildInput,
  options?: CheckOptions
): import("./types").CompatibilityResult {
  const hardFails: Issue[] = [];
  const warnings: Issue[] = [];
  const notes: Issue[] = [];
  let checksRun = 0;

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
    checksRun++;
    const r = socketMismatch(build.cpu, build.motherboard);
    if (r) hardFails.push(r);
  }

  if (build.ram && build.motherboard) {
    checksRun++;
    const r = ramTypeMismatch(build.ram, build.motherboard);
    if (r) hardFails.push(r);
  }

  if (build.motherboard && build.case) {
    checksRun++;
    const r = formFactorIncompatible(build.motherboard, build.case);
    if (r) hardFails.push(r);
  }

  if (build.gpu && build.case) {
    checksRun++;
    const r = gpuTooLong(build.gpu, build.case);
    if (r) hardFails.push(r);
    checksRun++;
    const r2 = gpuTooThick(build.gpu, build.case);
    if (r2) hardFails.push(r2);
  }

  if (build.cooler && build.case) {
    checksRun++;
    const r = coolerTooTall(build.cooler, build.case);
    if (r) hardFails.push(r);
    checksRun++;
    const rRad = radiatorNotSupported(build.cooler, build.case);
    if (rRad) hardFails.push(rRad);
    checksRun++;
    const rThick = radiatorTooThick(build.cooler, build.case);
    if (rThick) hardFails.push(rThick);
  }

  if (build.psu && build.case) {
    checksRun++;
    const r = psuTooLong(build.psu, build.case, ctx);
    if (r) hardFails.push(r);
  }

  if (build.gpu && build.psu) {
    checksRun++;
    const powerIssues = checkPowerConnectors(build.gpu, build.psu);
    for (const issue of powerIssues) {
      if (issue.severity === "critical") hardFails.push(issue);
      else warnings.push(issue);
    }
    const atxIssue = checkAtxStandard(build.gpu, build.psu);
    if (atxIssue) notes.push(atxIssue);
    if (!build.psu.specs.connectors) {
      const r = insufficientPsuConnectors(build.gpu, build.psu, ctx);
      if (r) hardFails.push(r);
    }
  }

  if (build.psu) {
    checksRun++;
    const r = insufficientPower(build.psu, load);
    if (r) hardFails.push(r);
  }

  if (build.motherboard && storage.length > 0) {
    checksRun++;
    const r = noM2Slots(storage, build.motherboard);
    if (r) hardFails.push(r);
  }

  if (build.case && storage.length > 0) {
    checksRun++;
    const r = check35DriveClearance(build);
    if (r) {
      if (r.severity === "critical") hardFails.push(r);
      else notes.push(r);
    }
  }

  if (build.cpu && build.cooler) {
    checksRun++;
    const coolingIssue = checkCoolingAdequacy(build.cpu, build.cooler);
    if (coolingIssue) {
      if (coolingIssue.severity === "critical") hardFails.push(coolingIssue);
      else if (coolingIssue.severity === "warning") warnings.push(coolingIssue);
      else notes.push(coolingIssue);
    }
  }

  // ----- Warnings -----

  if (build.psu && load > 0) {
    checksRun++;
    const r = lowPsuHeadroom(build.psu, load);
    if (r) warnings.push(r);
  }

  if (build.cpu && build.motherboard) {
    checksRun++;
    const r = biosUpdateNeeded(build.cpu, build.motherboard);
    if (r) warnings.push(r);
  }

  if (build.gpu && build.case) {
    checksRun++;
    const r = gpuThicknessRisk(build.gpu, build.case);
    if (r) warnings.push(r);
  }

  if (build.ram && build.cpu) {
    checksRun++;
    const r = ramSpeedRisk(build.ram, build.cpu);
    if (r) warnings.push(r);
  }

  if (build.ram && build.motherboard && build.cpu) {
    checksRun++;
    const r = checkECCSupport(build.ram, build.motherboard, build.cpu);
    if (r) {
      if (r.severity === "critical") hardFails.push(r);
      else if (r.severity === "warning") warnings.push(r);
      else notes.push(r);
    }
  }

  if (build.cooler && build.case) {
    checksRun++;
    const r = radiatorConflict(build.cooler, build.case);
    if (r) warnings.push(r);
  }

  if (build.motherboard) {
    checksRun++;
    const r = checkFanHeaders(build);
    if (r) warnings.push(r);
  }
  if (build.motherboard && build.cooler) {
    checksRun++;
    const r = checkRgbHeaders(build);
    if (r) warnings.push(r);
  }
  if (build.motherboard && build.case) {
    checksRun++;
    const r = checkUsbCHeader(build);
    if (r) warnings.push(r);
  }

  if (build.motherboard) {
    checksRun++;
    const r = noUpgradeRoom(build.motherboard, build.ram, storage);
    if (r) notes.push(r);
  }

  // ----- Efficiency checks (warnings/info only) -----
  const preset = options?.preset ?? "custom";
  if (build.cpu && build.gpu) {
    checksRun++;
    const r = checkCpuGpuBalance(build.cpu, build.gpu, preset);
    if (r) (r.severity === "warning" ? warnings : notes).push(r);
  }
  if (build.psu && load > 0) {
    checksRun++;
    const r = checkPsuOverkill(build.psu, load);
    if (r) notes.push(r);
  }
  if (build.ram && build.cpu) {
    checksRun++;
    const r = checkRamSpeedValue(build.ram, build.cpu, preset, build.motherboard);
    if (r) (r.severity === "warning" ? warnings : notes).push(r);
  }
  if (build.motherboard && build.cpu) {
    checksRun++;
    const r = checkMotherboardValue(build.motherboard, build.cpu, preset);
    if (r) notes.push(r);
  }
  if (storage.length > 0) {
    checksRun++;
    const r = checkStorageValue(storage, preset);
    if (r) notes.push(r);
  }

  const confidence = calculateConfidence(build, options);

  return {
    isCompatible: hardFails.length === 0,
    hardFails,
    warnings,
    notes,
    confidence,
    checksRun,
  };
}
