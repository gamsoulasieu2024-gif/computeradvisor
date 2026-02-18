/**
 * Value / price-performance scoring logic
 */

import type { BuildInput } from "@/lib/compatibility/types";
import type { Score, ScoreBreakdownItem, BuildPreset } from "./types";

/** Typical price ranges by tier (USD) - for heuristic when prices missing */
const TIER_PRICE_RANGES: Record<string, { min: number; max: number }> = {
  cpu: { min: 100, max: 700 },
  gpu: { min: 200, max: 1800 },
  ram: { min: 40, max: 300 },
};

function getTierMidPrice(tier: number, category: string): number {
  const range = TIER_PRICE_RANGES[category];
  if (!range) return 200;
  const t = (tier - 1) / 9;
  return range.min + t * (range.max - range.min);
}

/**
 * Calculate value score from build
 */
export function calculateValueScore(
  build: BuildInput,
  preset: BuildPreset = "custom"
): Score {
  const breakdown: ScoreBreakdownItem[] = [];
  const isGaming =
    preset === "gaming-1080p" ||
    preset === "gaming-1440p" ||
    preset === "gaming-4k";

  let totalPrice = 0;
  let totalTierScore = 0;
  let hasPrices = true;

  const cpuTier = build.cpu?.specs?.tier ?? 0;
  const gpuTier = build.gpu?.specs?.tier ?? 0;

  if (build.cpu) {
    const price = build.cpu.price_usd ?? getTierMidPrice(build.cpu.specs.tier, "cpu");
    if (build.cpu.price_usd == null) hasPrices = false;
    totalPrice += price;
    totalTierScore += build.cpu.specs.tier * 10; // tier 1-10 -> 10-100
  }

  if (build.gpu) {
    const price = build.gpu.price_usd ?? getTierMidPrice(build.gpu.specs.tier, "gpu");
    if (build.gpu.price_usd == null) hasPrices = false;
    totalPrice += price;
    totalTierScore += build.gpu.specs.tier * 10;
  }

  if (build.ram) {
    const price = build.ram.price_usd ?? 80;
    if (build.ram.price_usd == null) hasPrices = false;
    totalPrice += price;
    totalTierScore += 70; // RAM tier proxy
  }

  if (build.motherboard) {
    totalPrice += build.motherboard.price_usd ?? 150;
    if (build.motherboard.price_usd == null) hasPrices = false;
  }

  if (build.storage?.length) {
    for (const s of build.storage) {
      totalPrice += s.price_usd ?? 80;
      if (s.price_usd == null) hasPrices = false;
    }
  }

  if (build.psu) {
    totalPrice += build.psu.price_usd ?? 100;
    if (build.psu.price_usd == null) hasPrices = false;
  }

  let valueScore = 50; // Base

  // Price/performance ratio
  if (totalPrice > 0) {
    const perfPerDollar = totalTierScore / (totalPrice / 100);
    valueScore = Math.min(100, Math.round(30 + perfPerDollar * 0.5));
    breakdown.push({
      factor: "Price/performance",
      impact: valueScore - 50,
      explanation: hasPrices
        ? `~$${totalPrice} total for tier-equivalent performance.`
        : `Estimated price/performance (prices may be missing).`,
    });
  }

  // Imbalance penalty: high-end CPU + low-end GPU for gaming
  let imbalanceImpact = 0;
  if (isGaming && build.cpu && build.gpu) {
    const diff = cpuTier - gpuTier;
    if (diff > 3) {
      imbalanceImpact = -15;
      valueScore += imbalanceImpact;
      breakdown.push({
        factor: "Component imbalance",
        impact: imbalanceImpact,
        explanation:
          "High-end CPU with lower-end GPU for gaming. Consider reallocating budget to GPU.",
      });
    }
  }

  // Balanced reward: similar tier components
  if (build.cpu && build.gpu) {
    const diff = Math.abs(cpuTier - gpuTier);
    if (diff <= 1) {
      imbalanceImpact = 10;
      valueScore = Math.min(100, valueScore + imbalanceImpact);
      breakdown.push({
        factor: "Balanced components",
        impact: imbalanceImpact,
        explanation: "CPU and GPU are well-matched, avoiding bottlenecks.",
      });
    }
  }

  const value = Math.max(0, Math.min(100, Math.round(valueScore)));
  const confidence = hasPrices ? 80 : 50;

  const summary = hasPrices
    ? `Value score is ${value}. Build offers ${value >= 70 ? "good" : "moderate"} price-to-performance.`
    : `Value score is ${value} (estimated—add prices for accurate scoring).`;

  return {
    value,
    confidence,
    weight: 0.15,
    breakdown,
    summary,
  };
}
