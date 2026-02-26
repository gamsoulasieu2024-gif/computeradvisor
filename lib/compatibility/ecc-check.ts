/**
 * ECC (Error-Correcting Code) RAM compatibility
 */

import type { CPU, Motherboard, RAM } from "@/types/components";
import type { Issue } from "./types";

/**
 * Check if ECC RAM is supported by motherboard and CPU
 */
export function checkECCSupport(
  ram: RAM | undefined,
  motherboard: Motherboard | undefined,
  cpu: CPU | undefined
): Issue | null {
  if (!ram || !motherboard || !cpu) return null;

  const ramIsECC = ram.specs?.is_ecc === true;
  const moboSupportsECC = motherboard.specs?.supports_ecc === true;
  const cpuSupportsECC = cpu.specs?.supports_ecc === true;

  if (!ramIsECC) return null;

  if (!moboSupportsECC || !cpuSupportsECC) {
    const fixes: string[] = [];
    if (!moboSupportsECC) fixes.push("Choose a workstation/server motherboard with ECC support");
    if (!cpuSupportsECC) fixes.push("Choose Xeon, EPYC, or Ryzen Pro CPU with ECC support");
    fixes.push("Or choose non-ECC RAM for consumer platforms");

    return {
      id: "ecc-not-supported",
      category: "memory",
      severity: "critical",
      title: "ECC RAM Not Supported",
      description: [
        "Your ECC RAM requires both motherboard and CPU ECC support.",
        !moboSupportsECC ? "This motherboard does not support ECC." : "",
        !cpuSupportsECC ? "This CPU does not support ECC." : "",
      ]
        .filter(Boolean)
        .join(" "),
      affectedParts: [ram.id, motherboard.id, cpu.id],
      suggestedFixes: fixes,
      evidence: {
        values: {
          "RAM type": "ECC",
          "Motherboard ECC support": moboSupportsECC ? "Yes" : "No",
          "CPU ECC support": cpuSupportsECC ? "Yes" : "No",
        },
      },
    };
  }

  return {
    id: "ecc-info",
    category: "memory",
    severity: "info",
    title: "ECC RAM Enabled",
    description:
      "Your build supports ECC memory for improved data integrity. Ideal for workstations and servers where data accuracy is critical.",
    affectedParts: [ram.id],
    evidence: {
      values: {
        "RAM type": "ECC",
        Benefits: "Error correction, data integrity",
        "Use cases": "Workstations, servers, scientific computing",
      },
    },
  };
}
