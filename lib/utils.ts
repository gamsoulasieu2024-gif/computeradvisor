import { clsx, type ClassValue } from "clsx";

/**
 * Merges class names with Tailwind-friendly conflict resolution
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
