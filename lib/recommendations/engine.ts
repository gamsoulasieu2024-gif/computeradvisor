/**
 * Recommendation logic for upgrades and alternatives
 */

import type { BuildInput } from "@/lib/compatibility/types";
import type { CompatibilityResult } from "@/lib/compatibility/types";
import { estimateLoad } from "@/lib/compatibility/power";
import type { CPU, GPU, Motherboard, RAM, Storage, PSU, Cooler, Case } from "@/types/components";

export interface UpgradeSuggestion {
  category: string;
  currentPartId: string;
  currentPartName: string;
  suggestedPart: { id: string; name: string; price_usd?: number };
  reason: string;
  scoreDelta: number;
  priceDelta: number;
}

export interface AlternativeBuild {
  label: string;
  swaps: { category: string; from: string; to: string }[];
  scoreImpact: string;
}

export interface RecommendationResult {
  upgrades: UpgradeSuggestion[];
  alternatives: AlternativeBuild[];
}

export interface Catalog {
  cpus: CPU[];
  gpus: GPU[];
  motherboards: Motherboard[];
  ram: RAM[];
  storage: Storage[];
  psus: PSU[];
  coolers: Cooler[];
  cases: Case[];
}


/**
 * Generate upgrade suggestions based on compatibility issues and build state
 */
export function getRecommendations(
  build: BuildInput,
  compatResult: CompatibilityResult,
  catalog: Catalog
): RecommendationResult {
  const upgrades: UpgradeSuggestion[] = [];
  const alternatives: AlternativeBuild[] = [];

  const load = estimateLoad({
    cpu: build.cpu,
    gpu: build.gpu,
    ram: build.ram,
    storage: build.storage ?? [],
  });

  // GPU too long → filter GPUs that fit
  const gpuTooLong = compatResult.hardFails.find((i) => i.id === "gpuTooLong");
  if (gpuTooLong && build.gpu && build.case) {
    const maxLen = build.case.specs.max_gpu_length_mm;
    const gpuTier = build.gpu.specs.tier;
    const fits = catalog.gpus.filter(
      (g) => g.specs.length_mm <= maxLen && g.specs.tier >= gpuTier - 1
    );
    const best = fits
      .filter((g) => g.id !== build.gpu!.id)
      .sort((a, b) => (b.specs.tier ?? 0) - (a.specs.tier ?? 0))
      .slice(0, 2);
    for (const g of best) {
      upgrades.push({
        category: "gpu",
        currentPartId: build.gpu.id,
        currentPartName: build.gpu.name,
        suggestedPart: { id: g.id, name: g.name, price_usd: g.price_usd },
        reason: `Fits case (${g.specs.length_mm}mm ≤ ${maxLen}mm)`,
        scoreDelta: 15,
        priceDelta: (g.price_usd ?? 0) - (build.gpu.price_usd ?? 0),
      });
    }
  }

  // Low PSU headroom / insufficient power → suggest higher wattage PSU
  const psuIssue =
    compatResult.hardFails.find((i) => i.id === "insufficientPower") ??
    compatResult.warnings.find((i) => i.id === "lowPsuHeadroom");
  if (psuIssue && build.psu) {
    const minWattage = Math.ceil(load * 1.25);
    const better = catalog.psus
      .filter(
        (p) =>
          p.specs.wattage_w >= minWattage &&
          p.specs.wattage_w > build.psu!.specs.wattage_w
      )
      .sort((a, b) => a.specs.wattage_w - b.specs.wattage_w)
      .slice(0, 3);
    for (const p of better) {
      upgrades.push({
        category: "psu",
        currentPartId: build.psu.id,
        currentPartName: build.psu.name,
        suggestedPart: { id: p.id, name: p.name, price_usd: p.price_usd },
        reason: `${p.specs.wattage_w}W for better headroom`,
        scoreDelta: 10,
        priceDelta: (p.price_usd ?? 0) - (build.psu.price_usd ?? 0),
      });
    }
  }

  // CPU bottleneck (gaming) → suggest next tier CPU
  if (build.cpu && build.gpu && build.motherboard) {
    const diff = build.cpu.specs.tier - build.gpu.specs.tier;
    if (diff > 2) {
      const socket = build.motherboard.specs.socket;
      const better = catalog.cpus
        .filter(
          (c) =>
            c.specs.socket === socket &&
            c.specs.tier >= build.gpu!.specs.tier - 1 &&
            c.id !== build.cpu!.id
        )
        .sort((a, b) => b.specs.tier - a.specs.tier)
        .slice(0, 2);
      for (const c of better) {
        upgrades.push({
          category: "cpu",
          currentPartId: build.cpu.id,
          currentPartName: build.cpu.name,
          suggestedPart: { id: c.id, name: c.name, price_usd: c.price_usd },
          reason: "Better CPU/GPU balance for gaming",
          scoreDelta: 8,
          priceDelta: (c.price_usd ?? 0) - (build.cpu.price_usd ?? 0),
        });
      }
    }
  }

  // Ensure at least 2 upgrades
  if (upgrades.length < 2 && build.gpu) {
    const gpuTier = build.gpu.specs.tier;
    const betterGpu = catalog.gpus
      .filter((g) => g.specs.tier > gpuTier)
      .sort((a, b) => a.specs.tier - b.specs.tier)
      .slice(0, 1);
    for (const g of betterGpu) {
      if (!upgrades.some((u) => u.suggestedPart.id === g.id)) {
        upgrades.push({
          category: "gpu",
          currentPartId: build.gpu.id,
          currentPartName: build.gpu.name,
          suggestedPart: { id: g.id, name: g.name, price_usd: g.price_usd },
          reason: `Higher tier (${g.specs.tier} vs ${gpuTier})`,
          scoreDelta: 12,
          priceDelta: (g.price_usd ?? 0) - (build.gpu.price_usd ?? 0),
        });
      }
    }
  }

  // Alternatives: suggest swap combinations
  if (build.cpu && catalog.cpus.length > 1) {
    const alt = catalog.cpus.find(
      (c) =>
        c.specs.socket === build.cpu!.specs.socket &&
        c.id !== build.cpu!.id &&
        c.specs.tier !== build.cpu!.specs.tier
    );
    if (alt) {
      alternatives.push({
        label: `Switch to ${alt.name}`,
        swaps: [
          { category: "cpu", from: build.cpu.name, to: alt.name },
        ],
        scoreImpact: alt.specs.tier > build.cpu.specs.tier ? "+5–10 performance" : "Better value",
      });
    }
  }

  if (build.gpu && catalog.gpus.length > 1) {
    const alt = catalog.gpus.find(
      (g) =>
        g.id !== build.gpu!.id &&
        g.specs.tier > build.gpu!.specs.tier &&
        (!build.case || g.specs.length_mm <= build.case.specs.max_gpu_length_mm)
    );
    if (alt) {
      alternatives.push({
        label: `Upgrade to ${alt.name}`,
        swaps: [{ category: "gpu", from: build.gpu.name, to: alt.name }],
        scoreImpact: `+${Math.min(15, (alt.specs.tier - build.gpu.specs.tier) * 3)} performance`,
      });
    }
  }

  return { upgrades: upgrades.slice(0, 6), alternatives: alternatives.slice(0, 3) };
}
