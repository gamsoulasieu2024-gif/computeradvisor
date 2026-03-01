/**
 * Power and TCO (Total Cost of Ownership) calculations
 * Supports region-specific voltage efficiency and energy rates.
 */

/**
 * Wall draw (watts from outlet) = system load × efficiency multiplier.
 * US 120V: PSUs are typically ~2–3% less efficient than at 230V.
 */
export function wallDrawWatts(
  systemLoadW: number,
  efficiencyMultiplier: number
): number {
  return Math.round(systemLoadW * efficiencyMultiplier);
}

/**
 * Annual energy cost in local currency.
 * @param wallDrawW - Wall draw in watts (after efficiency multiplier)
 * @param hoursPerDay - Average hours per day the system is under load
 * @param ratePerKwh - Electricity rate (currency per kWh)
 */
export function calculateEnergyCost(
  wallDrawW: number,
  hoursPerDay: number,
  ratePerKwh: number
): number {
  const kwhPerYear = (wallDrawW / 1000) * hoursPerDay * 365;
  return kwhPerYear * ratePerKwh;
}

/**
 * TCO summary: wall draw and yearly cost for display.
 */
export function calculateTCO(
  systemLoadW: number,
  efficiencyMultiplier: number,
  ratePerKwh: number,
  hoursPerDay: number = 4
): { wallDrawW: number; yearlyCost: number } {
  const wallDrawW = wallDrawWatts(systemLoadW, efficiencyMultiplier);
  const yearlyCost = calculateEnergyCost(wallDrawW, hoursPerDay, ratePerKwh);
  return { wallDrawW, yearlyCost };
}
