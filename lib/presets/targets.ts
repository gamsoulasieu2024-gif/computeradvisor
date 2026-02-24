/**
 * Performance targets for gaming (resolution + refresh) and creator workloads
 */

export type GameTarget = {
  id: string;
  name: string;
  resolution: "1080p" | "1440p" | "4K";
  refreshRate: 60 | 75 | 120 | 144 | 165 | 240 | 360;
  minGpuTier: number;
  minCpuTier: number;
  description: string;
};

export type CreatorTarget = {
  id: string;
  name: string;
  primaryApps: string[];
  cpuWeight: number;
  gpuWeight: number;
  ramMin: number;
  storageMin: number;
  description: string;
};

export const GAME_TARGETS: GameTarget[] = [
  {
    id: "1080p-60",
    name: "1080p 60Hz",
    resolution: "1080p",
    refreshRate: 60,
    minGpuTier: 5,
    minCpuTier: 4,
    description: "Entry-level gaming, esports on medium settings",
  },
  {
    id: "1080p-144",
    name: "1080p 144Hz",
    resolution: "1080p",
    refreshRate: 144,
    minGpuTier: 6,
    minCpuTier: 6,
    description: "Competitive esports, high refresh rate gaming",
  },
  {
    id: "1440p-60",
    name: "1440p 60Hz",
    resolution: "1440p",
    refreshRate: 60,
    minGpuTier: 6,
    minCpuTier: 5,
    description: "Balanced 1440p gaming, AAA titles at high settings",
  },
  {
    id: "1440p-165",
    name: "1440p 165Hz",
    resolution: "1440p",
    refreshRate: 165,
    minGpuTier: 8,
    minCpuTier: 7,
    description: "High-end gaming, AAA at ultra + competitive esports",
  },
  {
    id: "4k-60",
    name: "4K 60Hz",
    resolution: "4K",
    refreshRate: 60,
    minGpuTier: 8,
    minCpuTier: 6,
    description: "Cinematic 4K gaming, beautiful visuals",
  },
  {
    id: "4k-120",
    name: "4K 120Hz",
    resolution: "4K",
    refreshRate: 120,
    minGpuTier: 10,
    minCpuTier: 8,
    description: "Enthusiast 4K high refresh, top-tier performance",
  },
];

export const CREATOR_TARGETS: CreatorTarget[] = [
  {
    id: "photo-editing",
    name: "Photo Editing",
    primaryApps: ["Photoshop", "Lightroom"],
    cpuWeight: 0.6,
    gpuWeight: 0.4,
    ramMin: 16,
    storageMin: 500,
    description: "Photo editing and retouching workflow",
  },
  {
    id: "video-1080p",
    name: "1080p Video Editing",
    primaryApps: ["Premiere Pro", "DaVinci Resolve"],
    cpuWeight: 0.7,
    gpuWeight: 0.3,
    ramMin: 32,
    storageMin: 1000,
    description: "1080p video editing and color grading",
  },
  {
    id: "video-4k",
    name: "4K Video Editing",
    primaryApps: ["Premiere Pro", "DaVinci Resolve", "After Effects"],
    cpuWeight: 0.6,
    gpuWeight: 0.4,
    ramMin: 64,
    storageMin: 2000,
    description: "4K video editing with effects and color grading",
  },
  {
    id: "3d-rendering",
    name: "3D Rendering",
    primaryApps: ["Blender", "Cinema 4D", "3ds Max"],
    cpuWeight: 0.5,
    gpuWeight: 0.5,
    ramMin: 32,
    storageMin: 1000,
    description: "3D modeling and GPU/CPU rendering",
  },
  {
    id: "game-dev",
    name: "Game Development",
    primaryApps: ["Unreal Engine", "Unity"],
    cpuWeight: 0.5,
    gpuWeight: 0.5,
    ramMin: 32,
    storageMin: 1000,
    description: "Game development and real-time rendering",
  },
  {
    id: "streaming",
    name: "Streaming + Gaming",
    primaryApps: ["OBS", "Streamlabs"],
    cpuWeight: 0.7,
    gpuWeight: 0.3,
    ramMin: 32,
    storageMin: 500,
    description: "Gaming while streaming to Twitch/YouTube",
  },
];

export function getTargetById(
  id: string
): GameTarget | CreatorTarget | undefined {
  return [...GAME_TARGETS, ...CREATOR_TARGETS].find((t) => t.id === id);
}

export type FitLevel = "below" | "meets" | "exceeds";

export interface TargetEvaluation {
  meetsTarget: boolean;
  cpuFit: FitLevel;
  gpuFit: FitLevel;
  ramFit: FitLevel;
  bottleneck: "cpu" | "gpu" | "ram" | "none";
  recommendation: string;
}

export function evaluateTargetFit(
  target: GameTarget | CreatorTarget,
  cpuTier: number,
  gpuTier: number,
  ramGb: number
): TargetEvaluation {
  let meetsTarget = true;
  let cpuFit: FitLevel = "meets";
  let gpuFit: FitLevel = "meets";
  let ramFit: FitLevel = "meets";
  let bottleneck: "cpu" | "gpu" | "ram" | "none" = "none";
  let recommendation = "";

  if ("minGpuTier" in target) {
    const gameTarget = target as GameTarget;

    if (cpuTier < gameTarget.minCpuTier) {
      cpuFit = "below";
      meetsTarget = false;
      bottleneck = "cpu";
      recommendation = `Upgrade to tier ${gameTarget.minCpuTier}+ CPU for smooth ${gameTarget.name} gaming`;
    } else if (cpuTier > gameTarget.minCpuTier + 2) {
      cpuFit = "exceeds";
    }

    if (gpuTier < gameTarget.minGpuTier) {
      gpuFit = "below";
      meetsTarget = false;
      if (bottleneck === "none") bottleneck = "gpu";
      recommendation = `Upgrade to tier ${gameTarget.minGpuTier}+ GPU for ${gameTarget.name} gaming`;
    } else if (gpuTier > gameTarget.minGpuTier + 2) {
      gpuFit = "exceeds";
    }

    const minRam = gameTarget.refreshRate >= 144 ? 32 : 16;
    if (ramGb < minRam) {
      ramFit = "below";
      if (meetsTarget) {
        recommendation = `Consider ${minRam}GB RAM for optimal ${gameTarget.name} performance`;
      }
    } else if (ramGb >= 32) {
      ramFit = "exceeds";
    }

    if (gpuTier < gameTarget.minGpuTier && cpuTier >= gameTarget.minCpuTier) {
      bottleneck = "gpu";
    } else if (
      cpuTier < gameTarget.minCpuTier &&
      gpuTier >= gameTarget.minGpuTier
    ) {
      bottleneck = "cpu";
    }
  } else {
    const creatorTarget = target as CreatorTarget;

    const minCpuTier = 7;
    if (cpuTier < minCpuTier) {
      cpuFit = "below";
      meetsTarget = false;
      bottleneck = "cpu";
      recommendation = `Upgrade to tier ${minCpuTier}+ CPU for ${creatorTarget.name}`;
    } else if (cpuTier >= 9) {
      cpuFit = "exceeds";
    }

    const minGpuTier = creatorTarget.gpuWeight > 0.4 ? 6 : 5;
    if (gpuTier < minGpuTier) {
      gpuFit = "below";
      if (creatorTarget.gpuWeight > 0.4) {
        meetsTarget = false;
        if (bottleneck === "none") bottleneck = "gpu";
      }
      recommendation = `Consider tier ${minGpuTier}+ GPU for GPU-accelerated ${creatorTarget.primaryApps.join(", ")}`;
    } else if (gpuTier >= 8) {
      gpuFit = "exceeds";
    }

    if (ramGb < creatorTarget.ramMin) {
      ramFit = "below";
      meetsTarget = false;
      if (bottleneck === "none") bottleneck = "ram";
      recommendation = `Upgrade to ${creatorTarget.ramMin}GB+ RAM for ${creatorTarget.name}`;
    } else if (ramGb >= creatorTarget.ramMin * 1.5) {
      ramFit = "exceeds";
    }
  }

  return {
    meetsTarget,
    cpuFit,
    gpuFit,
    ramFit,
    bottleneck,
    recommendation:
      recommendation || `Build meets ${target.name} requirements`,
  };
}
