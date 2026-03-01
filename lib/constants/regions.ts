/**
 * Regional config for power analytics and TCO (US vs EU)
 */

export type RegionKey = "US" | "EU";

export interface RegionConfig {
  label: string;
  currency: "USD" | "EUR";
  symbol: string;
  voltage: number;
  /** Default electricity rate (currency per kWh) */
  avgRate: number;
  /** Wall draw = system load × this (US ~1.03 for 120V efficiency loss) */
  efficiencyMultiplier: number;
  /** Continuous load limit (W) - warn above this */
  circuitLimitW: number;
}

/** Regional energy presets (currency per kWh) */
export const REGION_ENERGY_PRESETS: Record<
  RegionKey,
  { label: string; rate: number }[]
> = {
  US: [
    { label: "US Avg", rate: 0.17 },
    { label: "California", rate: 0.32 },
    { label: "Texas", rate: 0.14 },
  ],
  EU: [
    { label: "EU Avg", rate: 0.28 },
    { label: "Germany", rate: 0.4 },
    { label: "France", rate: 0.2 },
  ],
};

export const REGION_CONFIG: Record<RegionKey, RegionConfig> = {
  US: {
    label: "United States",
    currency: "USD",
    symbol: "$",
    voltage: 120,
    avgRate: 0.17,
    efficiencyMultiplier: 1.03, // ~3% loss at 120V
    circuitLimitW: 1440, // 15A × 120V
  },
  EU: {
    label: "Europe",
    currency: "EUR",
    symbol: "€",
    voltage: 230,
    avgRate: 0.28,
    efficiencyMultiplier: 1.0, // native efficiency at 230V
    circuitLimitW: 3000, // typical 13A/16A circuits
  },
};
