/**
 * Efficiency and value validation - detect overkill components and wasted budget
 */

import type { CPU, GPU, RAM, PSU, Motherboard, Storage } from "@/types/components";
import type { Issue } from "./types";

/**
 * Check for CPU/GPU imbalance (common waste)
 */
export function checkCpuGpuBalance(
  cpu: CPU | undefined,
  gpu: GPU | undefined,
  preset: string
): Issue | null {
  if (!cpu || !gpu) return null;

  const cpuTier = cpu.specs?.tier ?? 5;
  const gpuTier = gpu.specs?.tier ?? 5;
  const tierDiff = cpuTier - gpuTier;

  // Gaming: GPU should be priority
  if (preset.includes("gaming")) {
    if (tierDiff >= 3) {
      const cpuCost = cpu.price_usd ?? 0;
      const potentialSavings = cpuCost * 0.3;

      return {
        id: "cpu-overkill-gaming",
        category: "efficiency",
        severity: "warning",
        title: "CPU Overkill for Gaming",
        description: `Your CPU (tier ${cpuTier}) is much more powerful than your GPU (tier ${gpuTier}) for gaming. In most games, you're GPU-limited, so this CPU power goes unused.`,
        affectedParts: [cpu.id, gpu.id],
        suggestedFixes: [
          `Downgrade to tier ${gpuTier + 1} CPU and invest savings into better GPU`,
          `Upgrade GPU to tier ${cpuTier - 1} to match CPU capability`,
          "Keep CPU if planning non-gaming workloads (streaming, productivity)",
        ],
        evidence: {
          values: {
            "CPU tier": cpuTier.toString(),
            "GPU tier": gpuTier.toString(),
            "Imbalance": `CPU ${tierDiff} tiers higher`,
            "Use case": preset,
            "Estimated potential savings":
              cpuCost > 0 ? `~$${Math.round(potentialSavings)}` : "Unknown",
          },
          comparison: `${cpuTier} >> ${gpuTier} (GPU is bottleneck)`,
          calculation:
            "For gaming, GPU performance matters 2-3x more than CPU past tier 6",
        },
      };
    }

    // Opposite: GPU way too powerful for CPU
    if (tierDiff <= -3 && gpuTier >= 8) {
      return {
        id: "cpu-bottleneck-gaming",
        category: "efficiency",
        severity: "warning",
        title: "Potential CPU Bottleneck",
        description: `Your GPU (tier ${gpuTier}) is very powerful but your CPU (tier ${cpuTier}) may bottleneck it, especially at 1080p or in CPU-heavy games.`,
        affectedParts: [cpu.id, gpu.id],
        suggestedFixes: [
          `Upgrade CPU to tier ${gpuTier - 2} for balanced performance`,
          "Acceptable if playing at 4K (less CPU demand)",
          "Monitor CPU usage in games - if 90%+ consistently, upgrade CPU",
        ],
        evidence: {
          values: {
            "CPU tier": cpuTier.toString(),
            "GPU tier": gpuTier.toString(),
            "Imbalance": `GPU ${Math.abs(tierDiff)} tiers higher`,
            "Bottleneck risk": tierDiff <= -4 ? "High" : "Moderate",
          },
        },
      };
    }
  }

  // Creator/productivity: CPU more important
  if (preset.includes("creator")) {
    if (tierDiff <= -2) {
      return {
        id: "gpu-overkill-creator",
        category: "efficiency",
        severity: "info",
        title: "GPU May Be Overkill for Workload",
        description: `For creator workloads, your GPU (tier ${gpuTier}) is more powerful than your CPU (tier ${cpuTier}). Most creative apps are CPU-bound.`,
        affectedParts: [cpu.id, gpu.id],
        suggestedFixes: [
          "Consider if you really need this GPU power level",
          "If doing 3D/rendering, current balance is fine",
          "If mostly editing, could save on GPU and invest in faster CPU",
        ],
        evidence: {
          values: {
            "CPU tier": cpuTier.toString(),
            "GPU tier": gpuTier.toString(),
            "Workload": preset,
          },
        },
      };
    }
  }

  return null;
}

/**
 * Check for excessive PSU wattage
 */
export function checkPsuOverkill(
  psu: PSU | undefined,
  estimatedLoad: number
): Issue | null {
  if (!psu || !estimatedLoad) return null;

  const psuWattage = psu.specs?.wattage_w;
  if (!psuWattage) return null;

  const headroom = psuWattage / estimatedLoad;

  // Excessive headroom (>2x) with no clear benefit
  if (headroom > 2.0) {
    const wastedWattage = Math.round(psuWattage - estimatedLoad * 1.5);

    return {
      id: "psu-excessive",
      category: "efficiency",
      severity: "info",
      title: "PSU Wattage May Be Excessive",
      description: `Your ${psuWattage}W PSU provides ${Math.round((headroom - 1) * 100)}% headroom over the ${Math.round(estimatedLoad)}W estimated load. Recommended headroom is 25-50%.`,
      affectedParts: [psu.id],
      suggestedFixes: [
        `Consider ${Math.ceil((estimatedLoad * 1.4) / 50) * 50}W PSU for better efficiency`,
        "Keep current PSU if planning major future upgrades",
        `You're operating at ~${Math.round((estimatedLoad / psuWattage) * 100)}% load (PSUs are most efficient at 50-80%)`,
      ],
      evidence: {
        values: {
          "PSU wattage": `${psuWattage}W`,
          "Estimated load": `${Math.round(estimatedLoad)}W`,
          "Headroom": `${Math.round((headroom - 1) * 100)}%`,
          "Recommended": `${Math.ceil((estimatedLoad * 1.4) / 50) * 50}W`,
          "Excess capacity": `${wastedWattage}W unused`,
        },
        comparison: `${psuWattage}W >> ${Math.round(estimatedLoad * 1.5)}W recommended`,
        calculation: `PSU efficiency sweet spot is 50-80% load. You're at ${Math.round((estimatedLoad / psuWattage) * 100)}%.`,
      },
    };
  }

  return null;
}

/**
 * Check for expensive high-speed RAM with minimal benefit
 */
export function checkRamSpeedValue(
  ram: RAM | undefined,
  cpu: CPU | undefined,
  preset: string
): Issue | null {
  if (!ram || !cpu) return null;

  const ramSpeed = ram.specs?.speed_mhz;
  const cpuMaxSpeed = cpu.specs?.max_mem_speed_mhz;
  const ramPrice = ram.price_usd;

  if (!ramSpeed || !cpuMaxSpeed) return null;

  // Expensive fast RAM that CPU can't fully utilize
  if (ramSpeed > cpuMaxSpeed + 400) {
    return {
      id: "ram-speed-waste",
      category: "efficiency",
      severity: "warning",
      title: "RAM Speed Exceeds CPU Support",
      description: `Your RAM is ${ramSpeed}MT/s but your CPU officially supports up to ${cpuMaxSpeed}MT/s. You may not achieve rated speeds without overclocking.`,
      affectedParts: [ram.id, cpu.id],
      suggestedFixes: [
        `Choose ${cpuMaxSpeed}MT/s RAM for guaranteed compatibility`,
        "If overclocking, current RAM is fine",
        "Faster RAM requires XMP/EXPO and good motherboard",
      ],
      evidence: {
        values: {
          "RAM speed": `${ramSpeed}MT/s`,
          "CPU max official": `${cpuMaxSpeed}MT/s`,
          "Overspeed": `${ramSpeed - cpuMaxSpeed}MT/s`,
          "Needs": "XMP/EXPO overclocking profile",
        },
      },
    };
  }

  // Very fast RAM for gaming with minimal benefit
  if (preset.includes("gaming") && ramSpeed >= 6400 && ramPrice) {
    return {
      id: "ram-speed-gaming-waste",
      category: "efficiency",
      severity: "info",
      title: "Diminishing Returns on RAM Speed",
      description: `DDR5-${ramSpeed} provides minimal gaming benefit over DDR5-6000. The price premium rarely translates to noticeable FPS gains.`,
      affectedParts: [ram.id],
      suggestedFixes: [
        "DDR5-6000 CL30 offers best value/performance for gaming",
        "Keep current RAM if already purchased",
        "Speed above 6000 mainly benefits specific workloads (Cinebench, compression)",
      ],
      evidence: {
        values: {
          "Current speed": `${ramSpeed}MT/s`,
          "Sweet spot": "6000MT/s for gaming",
          "Gaming FPS improvement": "0-2% vs DDR5-6000",
          "Use case": preset,
        },
      },
    };
  }

  return null;
}

/**
 * Check for unnecessary premium motherboard features
 */
export function checkMotherboardValue(
  motherboard: Motherboard | undefined,
  cpu: CPU | undefined,
  preset: string
): Issue | null {
  if (!motherboard || !cpu) return null;

  const moboPrice = motherboard.price_usd;
  const moboChipset = motherboard.specs?.chipset?.toLowerCase();
  const cpuTier = cpu.specs?.tier ?? 5;

  if (!moboPrice || !moboChipset) return null;

  // High-end chipset (Z790, Z690, X670E) with mid-tier CPU
  const isHighEndChipset =
    moboChipset.includes("z7") ||
    moboChipset.includes("z6") ||
    moboChipset.includes("x670");

  if (isHighEndChipset && cpuTier < 7 && moboPrice > 250) {
    return {
      id: "motherboard-overkill",
      category: "efficiency",
      severity: "info",
      title: "Premium Motherboard with Mid-Range CPU",
      description: `Your ${motherboard.specs.chipset} motherboard has overclocking and premium features that your tier ${cpuTier} CPU may not fully utilize.`,
      affectedParts: [motherboard.id, cpu.id],
      suggestedFixes: [
        "B-series chipset would save $50-100 with similar performance",
        "Keep if planning CPU upgrade to K/X series",
        "Z/X chipsets mainly benefit overclockers",
      ],
      evidence: {
        values: {
          "Motherboard chipset": motherboard.specs.chipset,
          "Motherboard price": `$${moboPrice}`,
          "CPU tier": cpuTier.toString(),
          "Use case": preset,
        },
      },
    };
  }

  return null;
}

/**
 * Check for storage overkill
 */
export function checkStorageValue(
  storage: Storage[] | undefined,
  preset: string
): Issue | null {
  if (!storage || storage.length === 0) return null;

  const totalCapacity = storage.reduce(
    (sum, drive) => sum + (drive.specs?.capacity_gb ?? 0),
    0
  );

  // PCIe 5.0 class: very high read speed (>10GB/s) or explicit pcie_version
  const hasPCIe5 = storage.some(
    (d) =>
      (d.specs as { pcie_version?: number }).pcie_version === 5 ||
      (d.specs?.read_speed_mb_s ?? 0) > 10000
  );

  // PCIe 5.0 SSD for gaming (overkill)
  if (preset.includes("gaming") && hasPCIe5) {
    const pcie5Drives = storage.filter(
      (d) =>
        (d.specs as { pcie_version?: number }).pcie_version === 5 ||
        (d.specs?.read_speed_mb_s ?? 0) > 10000
    );
    return {
      id: "pcie5-gaming-waste",
      category: "efficiency",
      severity: "info",
      title: "PCIe 5.0 SSD Overkill for Gaming",
      description:
        "PCIe 5.0 SSDs provide no gaming benefit over PCIe 4.0. Game load times are similar. The price premium isn't justified for gaming-only builds.",
      affectedParts: pcie5Drives.map((d) => d.id),
      suggestedFixes: [
        "PCIe 4.0 NVMe offers identical gaming performance",
        "PCIe 5.0 mainly benefits professional workloads (large file transfers, databases)",
        "Save $50-100 with PCIe 4.0 drive",
      ],
      evidence: {
        values: {
          "Storage type": "PCIe 5.0",
          "Gaming benefit": "0% vs PCIe 4.0",
          "Load time difference": "<1 second",
          "Use case": preset,
        },
      },
    };
  }

  // Excessive storage for budget build
  if (preset.includes("budget") && totalCapacity > 2000) {
    return {
      id: "storage-excessive-budget",
      category: "efficiency",
      severity: "info",
      title: "High Storage Capacity for Budget Build",
      description: `You have ${Math.round(totalCapacity / 1000)}TB of storage. For budget builds, starting with 500GB-1TB and expanding later often provides better value.`,
      affectedParts: storage.map((d) => d.id),
      suggestedFixes: [
        "Start with 1TB NVMe, add storage later when needed",
        "Invest savings in better GPU or CPU",
        "Storage is easiest component to upgrade later",
      ],
      evidence: {
        values: {
          "Total storage": `${Math.round(totalCapacity / 1000)}TB`,
          "Recommended for budget": "500GB-1TB initially",
          "Expansion": "Easy to add more drives later",
        },
      },
    };
  }

  return null;
}
