/**
 * Scoring system - Score and result types
 */

export interface ScoreBreakdownItem {
  factor: string;
  impact: number;
  explanation: string;
}

export interface Score {
  value: number; // 0-100
  confidence: number; // 0-100
  weight: number; // weight in overall
  breakdown: ScoreBreakdownItem[];
  summary: string;
}

export interface ScoreResult {
  overall: number; // 0-100
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
