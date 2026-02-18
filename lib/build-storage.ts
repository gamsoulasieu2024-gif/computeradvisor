/**
 * Client-side build storage for shareable results
 */

import type { SelectedParts } from "@/lib/store/types";
import type { BuildPreset } from "@/lib/scoring/types";

export interface StoredBuild {
  id: string;
  selectedParts: SelectedParts;
  preset: BuildPreset;
  createdAt: string;
}

const STORAGE_PREFIX = "pc-build-";

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

export function saveBuild(
  selectedParts: SelectedParts,
  preset: BuildPreset
): string {
  const id = generateId();
  const stored: StoredBuild = {
    id,
    selectedParts,
    preset,
    createdAt: new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_PREFIX + id, JSON.stringify(stored));
  }
  return id;
}

export function loadBuild(id: string): StoredBuild | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_PREFIX + id);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredBuild;
  } catch {
    return null;
  }
}
