/**
 * Scoring system – Score and result types for the 4-score system
 */

export interface ScoreBreakdownItem {
  factor: string;
  impact: number;
  explanation: string;
}

export interface TargetEvaluation {
  meetsTarget: boolean;
  cpuFit: "below" | "meets" | "exceeds";
  gpuFit: "below" | "meets" | "exceeds";
  ramFit: "below" | "meets" | "exceeds";
  bottleneck: "cpu" | "gpu" | "ram" | "none";
  recommendation: string;
}

export interface Score {
  value: number; // 0-100
  confidence: number; // 0-100, reflects data quality
  weight: number; // weight in overall (e.g. 0.4 for compatibility)
  breakdown: ScoreBreakdownItem[];
  summary: string; // 2–3 sentence summary for UI
  /** Target evaluation when performance target is set */
  targetEvaluation?: TargetEvaluation;
  /** Target name when performance target is set */
  targetName?: string;
}

export interface ScoreResult {
  overall: number; // 0-100, weighted average (or compatibility * 0.5 if compat < 50)
  scores: {
    compatibility: Score;
    performance: Score;
    value: Score;
    usability: Score;
  };
}

export type BuildPreset =
  | "gaming-1080p"
  | "gaming-1440p"
  | "gaming-4k"
  | "creator"
  | "quiet"
  | "sff"
  | "budget"
  | "custom";
