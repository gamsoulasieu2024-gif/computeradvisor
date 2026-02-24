/**
 * Compatibility engine - Result and issue types
 *
 * Core result shape:
 * - isCompatible: true when hardFails.length === 0
 * - hardFails: critical issues that must be fixed
 * - warnings: recommended fixes
 * - notes: informational (e.g. no upgrade room)
 * - confidence: 0-100 data completeness score
 */

export type IssueSeverity = "critical" | "warning" | "info";

export interface IssueEvidence {
  values: Record<string, string | number>;
  comparison?: string;
  calculation?: string;
}

export interface Issue {
  id: string;
  category: string;
  severity: IssueSeverity;
  title: string;
  description: string;
  affectedParts: string[];
  suggestedFixes?: string[];
  evidence?: IssueEvidence;
}

export interface CompatibilityResult {
  isCompatible: boolean;
  hardFails: Issue[];
  warnings: Issue[];
  notes: Issue[];
  confidence: number; // 0-100
  /** Number of compatibility rules that were evaluated (for display) */
  checksRun: number;
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
