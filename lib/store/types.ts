/**
 * Build store - State and action types
 */

import type {
  CPU,
  GPU,
  Motherboard,
  RAM,
  Storage,
  PSU,
  Cooler,
  Case,
} from "@/types/components";

// ============ Presets ============

export type BuildPreset =
  | "gaming-1080p"
  | "gaming-1440p"
  | "gaming-4k"
  | "creator"
  | "quiet"
  | "sff"
  | "budget"
  | "custom";

// ============ Component Categories ============

export type PartCategory =
  | "cpu"
  | "gpu"
  | "motherboard"
  | "ram"
  | "storage"
  | "psu"
  | "cooler"
  | "case";

// ============ Part-to-Category Mapping ============

export type PartByCategory = {
  cpu: CPU;
  gpu: GPU;
  motherboard: Motherboard;
  ram: RAM;
  storage: Storage;
  psu: PSU;
  cooler: Cooler;
  case: Case;
};

// ============ Selected Parts ============

export interface SelectedParts {
  cpu?: CPU;
  gpu?: GPU;
  motherboard?: Motherboard;
  ram?: RAM;
  storage: Storage[];
  psu?: PSU;
  cooler?: Cooler;
  case?: Case;
}

// ============ Manual Overrides ============

export interface CaseClearances {
  maxGpuLengthMm?: number;
  maxCoolerHeightMm?: number;
  maxPsuLengthMm?: number;
}

export interface CustomSpecs {
  [key: string]: unknown;
}

export interface ManualOverrides {
  caseClearances?: CaseClearances;
  customSpecs?: CustomSpecs;
}

// ============ Build State ============

export interface BuildState {
  selectedParts: SelectedParts;
  buildId: string | null;
  preset: BuildPreset;
  /** Performance target (gaming resolution/refresh or creator workload) */
  targetId?: string;
  manualOverrides: ManualOverrides;
}

// ============ Store Actions ============

export interface BuildActions {
  setPreset: (preset: BuildPreset) => void;
  setTargetId: (targetId: string | undefined) => void;
  addPart: <K extends PartCategory>(
    category: K,
    part: PartByCategory[K],
    index?: number // used for storage array insert position
  ) => void;
  removePart: (category: PartCategory, index?: number) => void;
  updateManualOverride: (
    category: keyof ManualOverrides,
    overrides: Partial<ManualOverrides[typeof category]>
  ) => void;
  clearBuild: () => void;
  loadBuild: (buildId: string) => void;
  exportBuild: () => string;
  importBuild: (json: string) => void;
}

// ============ Store With Selectors ============

export interface BuildStore extends BuildState, BuildActions {
  getEstimatedLoad: () => number;
}

export type PCComponent =
  | CPU
  | GPU
  | Motherboard
  | RAM
  | Storage
  | PSU
  | Cooler
  | Case;
