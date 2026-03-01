/**
 * PC Build Advisor - Build and compatibility type definitions
 */

import type { CPU, GPU, Motherboard, RAM, Storage, PSU, Cooler, Case } from "./components";

// ============ Build ============

export interface Build {
  id: string;
  name?: string;
  createdAt: string; // ISO date string
  updatedAt: string;
  components: {
    cpu?: CPU;
    gpu?: GPU;
    motherboard?: Motherboard;
    ram?: RAM;
    storage: Storage[]; // Can have multiple drives
    psu?: PSU;
    cooler?: Cooler;
    case?: Case;
  };
}

// ============ Build metadata (for saved builds dashboard) ============

export interface BuildMetadata {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  description?: string;
  tags?: string[];
  isFavorite?: boolean;
}

// ============ Compatibility ============

export type CompatibilityStatus = "compatible" | "warning" | "error";

export interface CompatibilityIssue {
  code: string;
  message: string;
  severity: CompatibilityStatus;
  componentIds?: string[];
}

export interface CompatibilityResult {
  status: CompatibilityStatus;
  issues: CompatibilityIssue[];
  warnings: string[];
  isValid: boolean;
}

// ============ Performance Scoring ============

export interface BuildScore {
  overall: number; // 1-100
  gaming: number;
  productivity: number;
  value: number; // price-to-performance
  breakdown: {
    cpu_score: number;
    gpu_score: number;
    ram_score: number;
    storage_score: number;
  };
}

// Re-export for convenience
export type { CPU, GPU, Motherboard, RAM, Storage, PSU, Cooler, Case };
