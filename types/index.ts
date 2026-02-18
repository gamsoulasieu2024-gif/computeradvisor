/**
 * PC Build Advisor - TypeScript type definitions
 */

export type ComponentCategory =
  | "cpu"
  | "gpu"
  | "motherboard"
  | "ram"
  | "storage"
  | "psu"
  | "case"
  | "cooling";

export * from "./components";
export * from "./build";
