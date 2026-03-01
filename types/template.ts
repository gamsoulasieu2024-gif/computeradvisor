import type { SelectedParts } from "@/lib/store/types";
import type { BuildPreset } from "@/lib/store/types";
import type { ManualOverrides } from "@/lib/store/types";

export type TemplateCategory =
  | "gaming"
  | "creator"
  | "workstation"
  | "home-office"
  | "streaming"
  | "budget"
  | "enthusiast";

export type BudgetTier =
  | "under-800"
  | "800-1200"
  | "1200-1800"
  | "1800-2500"
  | "2500-plus";

export interface TemplateMetadata {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  budgetTier: BudgetTier;
  targetResolution?: "1080p" | "1440p" | "4K";
  targetRefreshRate?: number;
  createdAt: string;
  updatedAt: string;
  author: string;
  version: string;
  tags: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  pros: string[];
  cons: string[];
  idealFor: string[];
  notIdealFor: string[];
  estimatedPerformance?: string;
  featured?: boolean;
  popularity?: number;
}

/** Build payload for templates – matches store shape for importBuild */
export interface TemplateBuildPayload {
  selectedParts: SelectedParts;
  preset: BuildPreset;
  buildId?: string | null;
  manualOverrides?: ManualOverrides;
  targetId?: string;
}

export interface BuildTemplate {
  metadata: TemplateMetadata;
  build: TemplateBuildPayload;
}
