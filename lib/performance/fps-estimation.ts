/**
 * Conservative FPS estimation for gaming targets using tier-based heuristics.
 * NOT based on real benchmark data — rough guidance only.
 */

import type { CPU, GPU } from "@/types/components";
import type { GameTarget } from "@/lib/presets/targets";

export interface FPSEstimate {
  min: number;
  max: number;
  likely: number;
  confidence: "low" | "medium" | "high";
  settingsQuality: "Low" | "Medium" | "High" | "Ultra" | "Mixed";
  caveats: string[];
}

/**
 * Estimate FPS range for a gaming target (conservative, tier-based)
 */
export function estimateFPS(
  cpu: CPU | undefined,
  gpu: GPU | undefined,
  target: GameTarget
): FPSEstimate | null {
  if (!cpu || !gpu) return null;

  const cpuTier = cpu.specs?.tier ?? 5;
  const gpuTier = gpu.specs?.tier ?? 5;

  const baseFPS = calculateBaseFPS(gpuTier, target.resolution);
  const cpuFactor = calculateCPUFactor(
    cpuTier,
    target.resolution,
    target.refreshRate
  );
  const adjustedFPS = baseFPS * cpuFactor;
  const settingsQuality = determineSettingsQuality(
    gpuTier,
    target.resolution,
    target.refreshRate
  );

  const min = Math.floor(adjustedFPS * 0.85);
  const max = Math.floor(adjustedFPS * 1.15);
  const likely = Math.floor(adjustedFPS);

  const confidence = determineConfidence(cpuTier, gpuTier, target);
  const caveats = buildCaveats(
    cpuTier,
    gpuTier,
    target,
    settingsQuality
  );

  return {
    min,
    max,
    likely,
    confidence,
    settingsQuality,
    caveats,
  };
}

function calculateBaseFPS(gpuTier: number, resolution: string): number {
  const fpsMatrix: Record<string, Record<number, number>> = {
    "1080p": {
      3: 30,
      4: 45,
      5: 60,
      6: 80,
      7: 100,
      8: 120,
      9: 140,
      10: 160,
    },
    "1440p": {
      3: 20,
      4: 30,
      5: 40,
      6: 55,
      7: 70,
      8: 85,
      9: 100,
      10: 120,
    },
    "4K": {
      3: 10,
      4: 15,
      5: 20,
      6: 30,
      7: 40,
      8: 50,
      9: 65,
      10: 80,
    },
  };

  const tierFPS = fpsMatrix[resolution]?.[gpuTier];
  return tierFPS ?? 30;
}

function calculateCPUFactor(
  cpuTier: number,
  resolution: string,
  refreshRate: number
): number {
  if (resolution === "4K") {
    if (cpuTier >= 6) return 1.0;
    if (cpuTier >= 4) return 0.95;
    return 0.9;
  }

  if (resolution === "1440p") {
    if (refreshRate >= 144) {
      if (cpuTier >= 8) return 1.0;
      if (cpuTier >= 6) return 0.95;
      if (cpuTier >= 4) return 0.85;
      return 0.75;
    }
    if (cpuTier >= 6) return 1.0;
    if (cpuTier >= 4) return 0.95;
    return 0.9;
  }

  if (resolution === "1080p") {
    if (refreshRate >= 144) {
      if (cpuTier >= 8) return 1.0;
      if (cpuTier >= 7) return 0.95;
      if (cpuTier >= 6) return 0.85;
      if (cpuTier >= 5) return 0.75;
      return 0.65;
    }
    if (cpuTier >= 6) return 1.0;
    if (cpuTier >= 5) return 0.95;
    if (cpuTier >= 4) return 0.9;
    return 0.85;
  }

  return 1.0;
}

function determineSettingsQuality(
  gpuTier: number,
  resolution: string,
  refreshRate: number
): "Low" | "Medium" | "High" | "Ultra" | "Mixed" {
  const targetFPS = refreshRate;
  const baseFPS = calculateBaseFPS(gpuTier, resolution);
  const ratio = baseFPS / targetFPS;

  if (ratio >= 1.5) return "Ultra";
  if (ratio >= 1.2) return "High";
  if (ratio >= 1.0) return "Medium";
  if (ratio >= 0.8) return "Mixed";
  return "Low";
}

function determineConfidence(
  cpuTier: number,
  gpuTier: number,
  target: GameTarget
): "low" | "medium" | "high" {
  if (
    target.resolution === "1080p" &&
    target.refreshRate <= 144 &&
    gpuTier >= 6 &&
    cpuTier >= 6
  ) {
    return "high";
  }
  if (
    target.resolution === "1440p" &&
    target.refreshRate <= 60 &&
    gpuTier >= 7
  ) {
    return "high";
  }
  if (gpuTier >= 5 && cpuTier >= 5) {
    return "medium";
  }
  return "low";
}

function buildCaveats(
  cpuTier: number,
  gpuTier: number,
  target: GameTarget,
  settingsQuality: string
): string[] {
  const caveats: string[] = [
    "Estimates based on AAA games (Cyberpunk 2077, Starfield, etc.)",
    "Performance varies significantly by game optimization",
    `Assumes ${settingsQuality} settings without ray tracing`,
  ];

  if (
    target.resolution === "1080p" &&
    target.refreshRate >= 144 &&
    cpuTier < 7
  ) {
    caveats.push(
      "CPU may limit FPS in competitive titles (CS2, Valorant, etc.)"
    );
  }
  if (target.refreshRate >= 144) {
    caveats.push("Competitive games often run much higher (200-300+ FPS)");
  }
  if (target.resolution === "4K") {
    caveats.push("DLSS/FSR can significantly improve FPS");
  }
  if (gpuTier < 6 || cpuTier < 5) {
    caveats.push("May struggle with newest AAA titles");
  }
  if (target.refreshRate >= 144) {
    caveats.push("Esports titles (League, Valorant, CS2) run much better");
  }

  return caveats;
}

export type Genre = "aaa" | "esports" | "indie" | "simulation";

/**
 * Get FPS estimate adjusted by game genre
 */
export function estimateFPSByGenre(
  cpu: CPU | undefined,
  gpu: GPU | undefined,
  target: GameTarget,
  genre: Genre
): FPSEstimate | null {
  const baseEstimate = estimateFPS(cpu, gpu, target);
  if (!baseEstimate) return null;

  switch (genre) {
    case "esports":
      return {
        ...baseEstimate,
        min: Math.floor(baseEstimate.min * 2.5),
        max: Math.floor(baseEstimate.max * 3),
        likely: Math.floor(baseEstimate.likely * 2.8),
        settingsQuality: "Ultra",
        caveats: [
          "Esports titles are well-optimized and less demanding",
          "Expect 200-400+ FPS in games like CS2, Valorant, League",
          "CPU-limited in most cases, not GPU",
        ],
      };
    case "indie":
      return {
        ...baseEstimate,
        min: Math.floor(baseEstimate.min * 1.8),
        max: Math.floor(baseEstimate.max * 2.2),
        likely: Math.floor(baseEstimate.likely * 2),
        settingsQuality: "Ultra",
        caveats: [
          "Most indie games are less demanding than AAA",
          "Some poorly optimized indie games may run worse",
        ],
      };
    case "simulation":
      return {
        ...baseEstimate,
        min: Math.floor(baseEstimate.min * 0.7),
        max: Math.floor(baseEstimate.max * 0.8),
        likely: Math.floor(baseEstimate.likely * 0.75),
        caveats: [
          "Simulation games (Cities Skylines, Flight Sim) are very CPU-heavy",
          "Performance drops significantly in complex scenes",
          "May need lower settings than other genres",
        ],
      };
    case "aaa":
    default:
      return baseEstimate;
  }
}
