/**
 * Compatibility engine - Result and issue types
 */

export type IssueSeverity = "critical" | "warning" | "info";

export interface Issue {
  id: string;
  category: string;
  severity: IssueSeverity;
  title: string;
  description: string;
  affectedParts: string[];
  suggestedFixes?: string[];
}

export interface CompatibilityResult {
  isCompatible: boolean;
  hardFails: Issue[];
  warnings: Issue[];
  notes: Issue[];
  confidence: number; // 0-100
}

/** Build input for compatibility check - matches store selectedParts structure */
export interface BuildInput {
  cpu?: import("@/types/components").CPU;
  gpu?: import("@/types/components").GPU;
  motherboard?: import("@/types/components").Motherboard;
  ram?: import("@/types/components").RAM;
  storage?: import("@/types/components").Storage[];
  psu?: import("@/types/components").PSU;
  cooler?: import("@/types/components").Cooler;
  case?: import("@/types/components").Case;
}

/** Optional extended PSU fields for compatibility (when source data has them) */
export interface PsuConnectorInfo {
  /** Total PCIe 8-pin equivalent connectors (8-pin=1, 12-pin=1.5, 16-pin=2) */
  pcie_8pin_equivalent?: number;
  /** PSU length in mm */
  length_mm?: number;
}
