/**
 * Motherboard header validation: fan headers, RGB/ARGB, USB-C front panel
 */

import type { BuildInput } from "./types";
import type { Issue } from "./types";

/**
 * Calculate total fan header requirements (case + cooler fans; CPU fan uses CPU_FAN header)
 */
function calculateFanHeaderNeeds(build: BuildInput): {
  total4pin: number;
  sources: string[];
} {
  let total = 0;
  const sources: string[] = [];

  const caseFans = build.case?.specs?.preinstalled_fans ?? 0;
  if (caseFans > 0) {
    total += caseFans;
    sources.push(`${caseFans}x case fans`);
  }

  const coolerFans = build.cooler?.specs?.fan_count ?? 0;
  if (coolerFans > 0) {
    total += coolerFans;
    sources.push(`${coolerFans}x cooler fans`);
  }

  return { total4pin: total, sources };
}

/**
 * Check if motherboard has enough fan headers for case + cooler fans
 */
export function checkFanHeaders(build: BuildInput): Issue | null {
  const motherboard = build.motherboard;
  if (!motherboard?.specs?.headers) return null;

  const needs = calculateFanHeaderNeeds(build);
  const available = motherboard.specs.headers.fan_4pin;

  // CPU_FAN header is separate; reserve 1 for CPU cooler
  const sysHeaders = Math.max(0, available - 1);

  if (needs.total4pin > sysHeaders) {
    const shortage = needs.total4pin - sysHeaders;

    return {
      id: "insufficient-fan-headers",
      category: "headers",
      severity: "warning",
      title: "Not Enough Fan Headers",
      description: `Your build needs ${needs.total4pin} fan headers but motherboard only has ${sysHeaders} available (${available} total, 1 reserved for CPU). You'll need a fan splitter or hub.`,
      affectedParts: [motherboard.id, build.case?.id, build.cooler?.id].filter(
        Boolean
      ) as string[],
      suggestedFixes: [
        `Use ${shortage}x PWM fan splitter cable ($5-10)`,
        `Use powered fan hub for ${shortage}+ fans ($15-30)`,
        "Choose motherboard with more fan headers",
        "Reduce number of case fans",
      ],
      evidence: {
        values: {
          "Fan headers needed": needs.total4pin.toString(),
          Sources: needs.sources.join(", ") || "—",
          "Motherboard total": `${available} (1 CPU + ${sysHeaders} SYS)`,
          Shortage: shortage.toString(),
        },
        comparison: `${needs.total4pin} needed > ${sysHeaders} available`,
        calculation: `Motherboard has ${available} headers. Typically 1 is used for CPU cooler, leaving ${sysHeaders} for case fans.`,
      },
    };
  }

  return null;
}

/**
 * Check RGB/ARGB header compatibility between cooler and motherboard
 */
export function checkRgbHeaders(build: BuildInput): Issue | null {
  const motherboard = build.motherboard;
  const cooler = build.cooler;

  if (!motherboard?.specs?.headers || !cooler?.specs?.rgb_type) return null;
  if (cooler.specs.rgb_type === "none") return null;

  const coolerRgbType = cooler.specs.rgb_type;
  const has12vRgb = (motherboard.specs.headers.rgb_12v ?? 0) > 0;
  const has5vArgb = (motherboard.specs.headers.argb_5v ?? 0) > 0;

  if (coolerRgbType === "12v_rgb" && !has12vRgb) {
    return {
      id: "rgb-header-missing",
      category: "headers",
      severity: "warning",
      title: "No 12V RGB Header",
      description:
        "Your cooler uses 12V RGB but motherboard doesn't have a 12V RGB header. RGB lighting won't work without an adapter or controller.",
      affectedParts: [motherboard.id, cooler.id],
      suggestedFixes: [
        "Choose motherboard with 12V RGB header",
        "Use external RGB controller ($20-40)",
        "Choose cooler with 5V ARGB (more common)",
      ],
      evidence: {
        values: {
          "Cooler RGB type": "12V RGB (4-pin)",
          "Motherboard 12V RGB headers": "0",
          "Motherboard 5V ARGB headers": has5vArgb.toString(),
        },
        comparison: "12V RGB cooler, but no 12V RGB header on motherboard",
      },
    };
  }

  if (coolerRgbType === "5v_argb" && !has5vArgb) {
    return {
      id: "argb-header-missing",
      category: "headers",
      severity: "warning",
      title: "No 5V ARGB Header",
      description:
        "Your cooler uses 5V ARGB but motherboard doesn't have a 5V ARGB header. RGB lighting won't work without a controller.",
      affectedParts: [motherboard.id, cooler.id],
      suggestedFixes: [
        "Choose motherboard with 5V ARGB header",
        "Use external ARGB controller ($15-30)",
        "RGB lighting will not function",
      ],
      evidence: {
        values: {
          "Cooler RGB type": "5V ARGB (3-pin)",
          "Motherboard 5V ARGB headers": "0",
          "Motherboard 12V RGB headers": (
            motherboard.specs.headers.rgb_12v ?? 0
          ).toString(),
        },
        comparison: "5V ARGB cooler, but no 5V ARGB header on motherboard",
      },
    };
  }

  return null;
}

/**
 * Check USB-C front panel: case has USB-C port but motherboard has no Type-E header
 */
export function checkUsbCHeader(build: BuildInput): Issue | null {
  const motherboard = build.motherboard;
  const pcCase = build.case;

  if (!motherboard?.specs?.headers || !pcCase?.specs?.front_panel) return null;

  const caseHasUsbC = (pcCase.specs.front_panel.usb_c ?? 0) > 0;
  const moboHasUsbCHeader = (motherboard.specs.headers.usb_c_internal ?? 0) > 0;

  if (caseHasUsbC && !moboHasUsbCHeader) {
    return {
      id: "usbc-header-missing",
      category: "headers",
      severity: "warning",
      title: "Case USB-C Port Unusable",
      description:
        "Your case has a front USB-C port but motherboard doesn't have an internal USB-C header (Type-E). The front USB-C port won't work.",
      affectedParts: [motherboard.id, pcCase.id],
      suggestedFixes: [
        "Choose motherboard with USB-C internal header (Type-E, 20-pin)",
        "Front USB-C port will remain non-functional",
        "Use rear motherboard USB-C ports instead",
      ],
      evidence: {
        values: {
          "Case USB-C ports": (pcCase.specs.front_panel.usb_c ?? 0).toString(),
          "Motherboard USB-C header": moboHasUsbCHeader
            ? "Yes"
            : "No (Type-E missing)",
          "Motherboard USB 3.0 headers": (
            motherboard.specs.headers.usb3_internal ?? 0
          ).toString(),
        },
        comparison:
          "Case has USB-C, but motherboard lacks USB-C internal header",
      },
    };
  }

  return null;
}
