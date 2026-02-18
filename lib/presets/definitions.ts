/**
 * Preset configurations for build types
 */

import type { BuildPreset } from "@/lib/store/types";
import type { FormFactor } from "@/types/components";

export type BudgetRange = "low" | "mid" | "high";

export interface PriorityWeights {
  performance: number;
  value: number;
  usability: number;
}

export interface RecommendedSpecs {
  cpuTierMin?: number;
  cpuTierMax?: number;
  gpuTierMin?: number;
  gpuTierMax?: number;
  ramGbMin?: number;
  storageGbMin?: number;
  storageInterface?: "NVMe" | "SATA";
  cpuCoresMin?: number;
  /** SFF: only ITX */
  formFactors?: FormFactor[];
  /** SFF: max GPU length mm */
  maxGpuLengthMm?: number;
  /** Quiet: max TDP target */
  maxTdpTarget?: number;
}

export interface PresetDefinition {
  id: BuildPreset;
  name: string;
  description: string;
  icon: string;
  targetResolution?: "1080p" | "1440p" | "4k";
  budgetRange: BudgetRange;
  priorityWeights: PriorityWeights;
  recommendedSpecs: RecommendedSpecs;
}

export const PRESET_DEFINITIONS: PresetDefinition[] = [
  {
    id: "gaming-1080p",
    name: "Gaming 1080p",
    description: "Smooth 1080p gaming, value-focused",
    icon: "Gamepad2",
    targetResolution: "1080p",
    budgetRange: "mid",
    priorityWeights: { performance: 0.5, value: 0.35, usability: 0.15 },
    recommendedSpecs: {
      cpuTierMin: 5,
      cpuTierMax: 7,
      gpuTierMin: 5,
      gpuTierMax: 7,
      ramGbMin: 16,
      storageGbMin: 500,
    },
  },
  {
    id: "gaming-1440p",
    name: "Gaming 1440p",
    description: "High refresh 1440p, strong GPU",
    icon: "Gamepad2",
    targetResolution: "1440p",
    budgetRange: "mid",
    priorityWeights: { performance: 0.6, value: 0.25, usability: 0.15 },
    recommendedSpecs: {
      cpuTierMin: 6,
      cpuTierMax: 8,
      gpuTierMin: 7,
      gpuTierMax: 9,
      ramGbMin: 16,
      storageGbMin: 1000,
    },
  },
  {
    id: "gaming-4k",
    name: "Gaming 4K",
    description: "Ultimate 4K experience",
    icon: "Gamepad2",
    targetResolution: "4k",
    budgetRange: "high",
    priorityWeights: { performance: 0.75, value: 0.1, usability: 0.15 },
    recommendedSpecs: {
      cpuTierMin: 7,
      cpuTierMax: 10,
      gpuTierMin: 9,
      gpuTierMax: 10,
      ramGbMin: 32,
      storageGbMin: 1000,
    },
  },
  {
    id: "creator",
    name: "Creator",
    description: "Video, 3D, and content creation",
    icon: "Palette",
    budgetRange: "high",
    priorityWeights: { performance: 0.6, value: 0.2, usability: 0.2 },
    recommendedSpecs: {
      cpuTierMin: 7,
      cpuTierMax: 10,
      gpuTierMin: 6,
      gpuTierMax: 9,
      ramGbMin: 32,
      storageGbMin: 1000,
      storageInterface: "NVMe",
      cpuCoresMin: 8,
    },
  },
  {
    id: "quiet",
    name: "Quiet Build",
    description: "Low noise, low TDP focus",
    icon: "Volume2",
    budgetRange: "mid",
    priorityWeights: { performance: 0.35, value: 0.25, usability: 0.4 },
    recommendedSpecs: {
      cpuTierMin: 4,
      cpuTierMax: 7,
      gpuTierMin: 4,
      gpuTierMax: 7,
      ramGbMin: 16,
      storageGbMin: 500,
      maxTdpTarget: 150,
    },
  },
  {
    id: "sff",
    name: "SFF",
    description: "Small form factor, compact builds",
    icon: "Box",
    budgetRange: "mid",
    priorityWeights: { performance: 0.5, value: 0.2, usability: 0.3 },
    recommendedSpecs: {
      formFactors: ["Mini-ITX"],
      maxGpuLengthMm: 250,
      cpuTierMin: 4,
      gpuTierMin: 4,
      ramGbMin: 16,
      storageGbMin: 500,
    },
  },
  {
    id: "budget",
    name: "Budget",
    description: "Maximum value, lower tiers OK",
    icon: "Wallet",
    budgetRange: "low",
    priorityWeights: { performance: 0.3, value: 0.55, usability: 0.15 },
    recommendedSpecs: {
      cpuTierMin: 3,
      cpuTierMax: 6,
      gpuTierMin: 3,
      gpuTierMax: 6,
      ramGbMin: 16,
      storageGbMin: 500,
    },
  },
  {
    id: "custom",
    name: "Custom",
    description: "No constraints, full control",
    icon: "Wrench",
    budgetRange: "mid",
    priorityWeights: { performance: 0.33, value: 0.33, usability: 0.34 },
    recommendedSpecs: {},
  },
];

export function getPresetDefinition(id: BuildPreset): PresetDefinition {
  return (
    PRESET_DEFINITIONS.find((p) => p.id === id) ?? PRESET_DEFINITIONS[7]
  );
}
