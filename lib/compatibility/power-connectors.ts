/**
 * PSU power connector validation: 12VHPWR, 8-pin PCIe, ATX 3.0 compatibility
 */

import type { GPU, PSU } from "@/types/components";
import type { Issue } from "./types";

interface ConnectorRequirement {
  pin_8: number;
  pin_6: number;
  pin_16: number;
}

/**
 * Parse GPU power connector strings (legacy "16-pin"/"8-pin" or new "1x16pin"/"2x8pin") into counts
 */
function parseGpuConnectors(connectors: string[]): ConnectorRequirement {
  const req: ConnectorRequirement = { pin_8: 0, pin_6: 0, pin_16: 0 };

  for (const conn of connectors) {
    const lower = String(conn).toLowerCase();

    if (lower.includes("16pin") || lower.includes("12vhpwr") || lower === "16-pin" || lower === "12-pin") {
      req.pin_16++;
    } else if (lower.includes("3x8pin")) {
      req.pin_8 += 3;
    } else if (lower.includes("2x8pin")) {
      req.pin_8 += 2;
    } else if (lower.includes("1x8pin")) {
      req.pin_8++;
    } else if (lower.includes("8pin") || lower === "8-pin") {
      const matches = lower.match(/(\d+)x8pin/);
      if (matches) {
        req.pin_8 += parseInt(matches[1], 10);
      } else {
        req.pin_8++;
      }
    }

    if (lower.includes("6pin") || lower === "6-pin") {
      const matches = lower.match(/(\d+)x6pin/);
      if (matches) {
        req.pin_6 += parseInt(matches[1], 10);
      } else if (!lower.includes("8pin")) {
        req.pin_6++;
      }
    }
  }

  // "1x8pin+1x6pin" etc. - already counted above if we hit 8pin/6pin
  for (const conn of connectors) {
    const lower = String(conn).toLowerCase();
    if (lower.includes("+1x6pin") || lower.includes("+ 1x6pin")) req.pin_6 += 1;
    if (lower.includes("+2x6pin") || lower.includes("+ 2x6pin")) req.pin_6 += 2;
  }

  return req;
}

function getPsuConnectors(psu: PSU): ConnectorRequirement {
  const c = psu.specs.connectors;
  return {
    pin_8: c?.pin_8_pcie ?? 0,
    pin_6: c?.pin_6_pcie ?? 0,
    pin_16: c?.pin_16_12vhpwr ?? 0,
  };
}

/**
 * Check if PSU has sufficient connectors for GPU. Returns all applicable issues (critical + warnings).
 */
export function checkPowerConnectors(
  gpu: GPU | undefined,
  psu: PSU | undefined
): Issue[] {
  const issues: Issue[] = [];
  if (!gpu || !psu) return issues;

  const gpuConnectors = gpu.specs?.power_connectors;
  const psuConnectors = psu.specs?.connectors;

  if (!gpuConnectors || gpuConnectors.length === 0) {
    return issues;
  }

  if (!psuConnectors) {
    issues.push({
      id: "psu-connectors-unknown",
      category: "power",
      severity: "warning",
      title: "PSU Connector Details Unknown",
      description: `Your GPU requires ${gpuConnectors.join(" or ")} but PSU connector info is not specified.`,
      affectedParts: [gpu.id, psu.id],
      suggestedFixes: [
        "Enter PSU connector details manually",
        "Check PSU specifications",
        "Verify PSU has the required connectors",
      ],
      evidence: {
        values: {
          "GPU requires": gpuConnectors.join(" or "),
          "PSU connectors": "Unknown",
        },
      },
    });
    return issues;
  }

  const required = parseGpuConnectors(gpuConnectors);
  const available = getPsuConnectors(psu);

  // Check 16-pin (12VHPWR)
  if (required.pin_16 > 0) {
    if (available.pin_16 === 0) {
      const has8pinForAdapter = available.pin_8 >= 2;
      issues.push({
        id: "missing-12vhpwr",
        category: "power",
        severity: has8pinForAdapter ? "warning" : "critical",
        title: has8pinForAdapter
          ? "No Native 12VHPWR - Adapter Required"
          : "Insufficient Power Connectors",
        description: has8pinForAdapter
          ? "Your GPU needs 12VHPWR (16-pin) but the PSU only has 8-pin connectors. You'll need to use the included adapter (2x 8-pin to 12VHPWR). This works but limits transient power handling."
          : "Your GPU needs 12VHPWR (16-pin) but the PSU doesn't have it or enough 8-pin connectors for an adapter.",
        affectedParts: [gpu.id, psu.id],
        suggestedFixes: has8pinForAdapter
          ? [
              "Use included GPU adapter (2x 8-pin to 12VHPWR)",
              "Upgrade to ATX 3.0 PSU with native 12VHPWR for better power delivery",
              "Ensure PSU can handle transient power spikes",
            ]
          : [
              "Choose PSU with native 12VHPWR connector",
              "Choose PSU with at least 2x 8-pin PCIe connectors for adapter",
              "Consider different GPU",
            ],
        evidence: {
          values: {
            "GPU requires": "1x 12VHPWR (16-pin)",
            "PSU has 16-pin": available.pin_16.toString(),
            "PSU has 8-pin": available.pin_8.toString(),
            "Adapter viable": has8pinForAdapter ? "Yes (2x 8-pin available)" : "No",
          },
          comparison:
            available.pin_16 === 0
              ? "0 native 12VHPWR connectors"
              : `${available.pin_16} < ${required.pin_16} required`,
          calculation: has8pinForAdapter
            ? "Can use adapter: 2x 8-pin → 1x 12VHPWR (limited to ~300W per connector)"
            : "Insufficient connectors for adapter",
        },
      });
    }

    if (available.pin_16 === 0 && available.pin_8 >= 2) {
      const gpuPeakPower = gpu.specs?.peak_power_w ?? gpu.specs?.tdp_w * 1.5;
      if (gpuPeakPower && gpuPeakPower > 450) {
        issues.push({
          id: "adapter-transient-risk",
          category: "power",
          severity: "warning",
          title: "High Transient Power with Adapter",
          description: `Your GPU can spike to ~${Math.round(gpuPeakPower)}W but the adapter limits peak power delivery. May cause instability under load.`,
          affectedParts: [gpu.id, psu.id],
          suggestedFixes: [
            "Strongly recommend ATX 3.0 PSU with native 12VHPWR",
            "Limit power target in GPU settings to avoid spikes",
            "Ensure high-quality PSU with strong 12V rail",
          ],
          evidence: {
            values: {
              "GPU peak power": `~${Math.round(gpuPeakPower)}W`,
              "Adapter safe limit": "~450W",
              "Risk level": gpuPeakPower > 500 ? "High" : "Moderate",
            },
          },
        });
      }
    }
  }

  if (required.pin_16 > 0 && available.pin_16 > 0 && available.pin_16 < required.pin_16) {
    issues.push({
      id: "insufficient-12vhpwr",
      category: "power",
      severity: "critical",
      title: "Not Enough 12VHPWR Connectors",
      description: `Your GPU needs ${required.pin_16}x 12VHPWR connectors but PSU only has ${available.pin_16}.`,
      affectedParts: [gpu.id, psu.id],
      suggestedFixes: [
        `Choose PSU with ${required.pin_16}+ 12VHPWR connectors`,
        "Choose different GPU",
      ],
      evidence: {
        values: {
          Required: `${required.pin_16}x 12VHPWR`,
          Available: `${available.pin_16}x 12VHPWR`,
        },
        comparison: `${available.pin_16} < ${required.pin_16}`,
      },
    });
  }

  // Check 8-pin connectors
  if (required.pin_8 > 0 && available.pin_8 < required.pin_8) {
    issues.push({
      id: "insufficient-8pin",
      category: "power",
      severity: "critical",
      title: "Not Enough 8-Pin PCIe Connectors",
      description: `Your GPU needs ${required.pin_8}x 8-pin (6+2) connectors but PSU only has ${available.pin_8}.`,
      affectedParts: [gpu.id, psu.id],
      suggestedFixes: [
        `Choose PSU with ${required.pin_8}+ 8-pin PCIe connectors`,
        "Choose different GPU with lower power requirements",
      ],
      evidence: {
        values: {
          Required: `${required.pin_8}x 8-pin PCIe`,
          Available: `${available.pin_8}x 8-pin PCIe`,
          Shortage: `${required.pin_8 - available.pin_8} connectors`,
        },
        comparison: `${available.pin_8} < ${required.pin_8}`,
      },
    });
  }

  // Check 6-pin (8-pin can substitute for 6-pin)
  if (required.pin_6 > 0) {
    const totalPcie = available.pin_6 + available.pin_8;
    const totalRequired = required.pin_6 + required.pin_8;
    if (totalPcie < totalRequired) {
      issues.push({
        id: "insufficient-6pin",
        category: "power",
        severity: "critical",
        title: "Not Enough 6-Pin PCIe Connectors",
        description: `Your GPU needs ${required.pin_6}x 6-pin and ${required.pin_8}x 8-pin. PSU has ${available.pin_6}x 6-pin and ${available.pin_8}x 8-pin (8-pin can be used as 6-pin).`,
        affectedParts: [gpu.id, psu.id],
        suggestedFixes: [
          "Use 8-pin connectors as 6-pin (only plug in 6 pins)",
          "Choose PSU with more PCIe power connectors",
        ],
        evidence: {
          values: {
            "Required total": `${totalRequired} PCIe (6+8 pin)`,
            "Available 6-pin": available.pin_6.toString(),
            "Available 8-pin": `${available.pin_8} (can substitute for 6-pin)`,
            "Total available": totalPcie.toString(),
          },
        },
      });
    }
  }

  return issues;
}

/**
 * Check ATX 3.0 vs 2.x for 12VHPWR GPUs
 */
export function checkAtxStandard(
  gpu: GPU | undefined,
  psu: PSU | undefined
): Issue | null {
  if (!gpu || !psu) return null;

  const gpuConnectors = gpu.specs?.power_connectors ?? [];
  const gpuNeeds12VHPWR = gpuConnectors.some(
    (c) =>
      String(c).toLowerCase().includes("16pin") ||
      String(c).toLowerCase().includes("12vhpwr") ||
      c === "16-pin" ||
      c === "12-pin"
  );

  const atxVersion = psu.specs.atx_version;
  const atxStandard = psu.specs.atx_standard;
  const psuStandard =
    atxStandard ??
    (atxVersion === "3.0" ? "ATX3.0" : atxVersion === "2.x" ? "ATX2.x" : undefined);
  const has12VHPWR = (psu.specs.connectors?.pin_16_12vhpwr ?? 0) > 0;

  if (
    gpuNeeds12VHPWR &&
    (psuStandard === "ATX2.x" || (!psuStandard && !has12VHPWR)) &&
    !has12VHPWR
  ) {
    return {
      id: "atx-2-with-modern-gpu",
      category: "power",
      severity: "info",
      title: "ATX 2.x PSU with Modern GPU",
      description:
        "Your GPU uses 12VHPWR (16-pin) power but your PSU is ATX 2.x standard. You'll need an adapter which limits transient power handling. ATX 3.0 PSUs are designed for modern GPU power spikes.",
      affectedParts: [gpu.id, psu.id],
      suggestedFixes: [
        "Current setup works with adapter but consider ATX 3.0 upgrade",
        "ATX 3.0 provides better transient response for power spikes",
        "If experiencing instability, upgrade to ATX 3.0 PSU",
      ],
      evidence: {
        values: {
          "PSU standard": psuStandard ?? "Unknown",
          "GPU connector": "12VHPWR (ATX 3.0 native)",
          Compatibility: "Works with adapter (included with GPU)",
          Recommended: "ATX 3.0 PSU for optimal power delivery",
        },
      },
    };
  }

  return null;
}
