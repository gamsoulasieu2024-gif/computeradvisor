/**
 * Helpers for clearance calculations and visualization
 */

/**
 * Calculate clearance utilization percentage
 */
export function calculateClearanceUtilization(
  componentSize: number,
  maxClearance: number
): number {
  if (!maxClearance || maxClearance === 0) return 0;
  return (componentSize / maxClearance) * 100;
}

/**
 * Get clearance status
 */
export function getClearanceStatus(
  componentSize: number,
  maxClearance: number
): "ok" | "tight" | "conflict" | "unknown" {
  if (!componentSize || !maxClearance) return "unknown";

  const utilization = calculateClearanceUtilization(
    componentSize,
    maxClearance
  );

  if (utilization > 100) return "conflict";
  if (utilization > 90) return "tight";
  return "ok";
}

/**
 * Get Tailwind-compatible class for clearance status
 */
export function getClearanceColor(status: string): string {
  switch (status) {
    case "ok":
      return "bg-primary";
    case "tight":
      return "bg-yellow-500";
    case "conflict":
      return "bg-red-500";
    default:
      return "bg-muted";
  }
}

/**
 * Generate SVG path data for isometric case faces (simplified)
 */
export function generateIsometricCasePath(
  width: number,
  height: number,
  depth: number
): {
  front: string;
  side: string;
  top: string;
} {
  const isoX = (x: number, z: number) => x - z * 0.5;
  const isoY = (y: number, x: number, z: number) =>
    y - (x + z) * 0.25;

  return {
    front: `M ${isoX(0, 0)} ${isoY(height, 0, 0)}
            L ${isoX(0, 0)} ${isoY(0, 0, 0)}
            L ${isoX(width, 0)} ${isoY(0, width, 0)}
            L ${isoX(width, 0)} ${isoY(height, width, 0)} Z`,
    side: `M ${isoX(width, 0)} ${isoY(0, width, 0)}
           L ${isoX(width, depth)} ${isoY(0, width, depth)}
           L ${isoX(width, depth)} ${isoY(height, width, depth)}
           L ${isoX(width, 0)} ${isoY(height, width, 0)} Z`,
    top: `M ${isoX(0, 0)} ${isoY(0, 0, 0)}
          L ${isoX(0, depth)} ${isoY(0, 0, depth)}
          L ${isoX(width, depth)} ${isoY(0, width, depth)}
          L ${isoX(width, 0)} ${isoY(0, width, 0)} Z`,
  };
}
